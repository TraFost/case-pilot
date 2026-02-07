import { useAction, useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatAuditTimestamp, formatDateTime } from "@/utils/date.util";

const EMBEDDING_ACTIONS = new Set(["FREEZE", "RESOLVE"]);

type TimelineItem = {
	time: string;
	event: string;
};

type TransactionTimelineItem = {
	time: string;
	amount: string;
	type: string;
	note: string;
	highlight: boolean;
};

type AuditLog = {
	timestamp: string;
	action: string;
	actor: string;
	justification: string;
};

export function useCaseDetail(alertId: string) {
	const parsedAlertId = alertId as Id<"alerts">;
	const caseData = useQuery(api.cases.getCaseDetailByAlertId, {
		alertId: parsedAlertId,
	});
	const fraudNetwork = useQuery(api.cases.getFraudRingNetworkByAlertId, {
		alertId: parsedAlertId,
	});

	const analyzeAlert = useAction(api.cases_actions.analyzeAlert);
	const createEnforcementAction = useMutation(
		api.actions.createEnforcementAction,
	);
	const generateAndSaveEvidence = useAction(
		api.embed_actions.generateAndSaveEvidence,
	);

	const analyzingRef = useRef(false);

	useEffect(() => {
		if (!caseData || analyzingRef.current) return;
		if (!caseData.alert || caseData.case) return;

		analyzingRef.current = true;
		analyzeAlert({ alertId: parsedAlertId })
			.catch(() => {
				analyzingRef.current = false;
			})
			.finally(() => {
				analyzingRef.current = false;
			});
	}, [caseData, analyzeAlert, parsedAlertId]);

	const auditLogs = useMemo<AuditLog[]>(() => {
		if (!caseData?.actions) return [];

		return caseData.actions.map((action) => {
			return {
				timestamp: formatAuditTimestamp(action.executedAt),
				action: action.type,
				actor: action.executedBy,
				justification: action.notes ?? "Automated enforcement action",
			};
		});
	}, [caseData?.actions]);

	const reportTimeline = useMemo<TimelineItem[]>(() => {
		const timeline = caseData?.case?.timeline;
		if (!Array.isArray(timeline)) return [];

		return timeline
			.filter((item) => item && typeof item === "object")
			.map((item) => ({
				time: String(item.time ?? ""),
				event: String(item.event ?? ""),
			}))
			.filter((item) => item.time || item.event);
	}, [caseData?.case?.timeline]);

	const topSignals = useMemo<string[]>(() => {
		if (!caseData?.alert) return [];

		const signals: string[] = [];
		const suspiciousCount = caseData.transactions?.filter(
			(tx) => tx.isFraud || tx.fraudTag,
		).length;

		signals.push(`Trigger: ${caseData.alert.trigger}`);
		signals.push(`Risk score: ${caseData.alert.riskScore}`);
		if (suspiciousCount) {
			signals.push(`${suspiciousCount} suspicious transactions detected`);
		}
		if (caseData.user?.status) {
			signals.push(`Account status: ${caseData.user.status}`);
		}

		return signals;
	}, [caseData]);

	const derived = useMemo(() => {
		if (!caseData) {
			return {
				caseTitle: "",
				caseSubtitle: "",
				riskScore: 0,
				summary: "",
				confidence: 0,
				recommendedAction: "",
				evidenceCount: 0,
				fraudTags: [] as string[],
				currencies: [] as string[],
				devices: [] as string[],
				locations: [] as string[],
				lastUpdatedLabel: "",
			};
		}

		const caseTitle = caseData.case
			? `Case #${caseData.case._id}`
			: `Alert #${caseData.alert._id}`;
		const caseSubtitle = caseData.alert.trigger;
		const riskScore = caseData.alert.riskScore;
		const summary = caseData.case?.summary ?? "";
		const confidence = caseData.case?.confidence ?? 0;
		const recommendedAction = caseData.case?.recommendedAction ?? "";
		const evidenceCount = caseData.alert.evidenceTxIds.length;
		const fraudTags = Array.from(
			new Set(
				caseData.transactions
					.map((tx) => tx.fraudTag)
					.filter((tag): tag is string => Boolean(tag)),
			),
		);
		const currencies = Array.from(
			new Set(caseData.transactions.map((tx) => tx.currency)),
		);
		const devices = Array.from(
			new Set(
				caseData.transactions
					.map((tx) => tx.meta?.device)
					.filter((device): device is string => Boolean(device)),
			),
		);
		const locations = Array.from(
			new Set(
				caseData.transactions
					.map((tx) => {
						const location = tx.meta?.location;
						if (!location) return null;
						if (typeof location === "string") return location;
						if (typeof location === "object" && location.countryCode) {
							return location.countryCode;
						}
						if (typeof location === "object" && location.country) {
							return location.country;
						}
						return null;
					})
					.filter((location): location is string => Boolean(location)),
			),
		);
		const lastUpdatedLabel = formatDateTime(caseData.alert.createdAt);

		return {
			caseTitle,
			caseSubtitle,
			riskScore,
			summary,
			confidence,
			recommendedAction,
			evidenceCount,
			fraudTags,
			currencies,
			devices,
			locations,
			lastUpdatedLabel,
		};
	}, [caseData]);

	const handleEnforcementAction = useCallback(
		async (actionName: string) => {
			if (!caseData?.case || !caseData.user) return;

			const executedAt = Date.now();
			const notes =
				actionName === "FREEZE"
					? "Confirmed fraud. High risk behavior verified."
					: "Cleared false positive after verification.";

			await createEnforcementAction({
				caseId: caseData.case._id,
				userId: caseData.user._id,
				type: actionName,
				executedBy: "Analyst",
				executedAt,
				result: "Success",
				notes,
				userStatus: actionName === "FREEZE" ? "Frozen" : "Active",
				caseStatus: "Closed",
			});

			if (EMBEDDING_ACTIONS.has(actionName)) {
				const narrative =
					actionName === "FREEZE"
						? `FRAUD CONFIRMED: User ${caseData.user.name} was frozen. Risk Pattern: ${caseData.alert.trigger}. Analyst Notes: ${notes}`
						: `FALSE POSITIVE CLEARED: User ${caseData.user.name} was resolved. Trigger: ${caseData.alert.trigger} was investigated. Outcome: Activity deemed legitimate. Reason: ${notes}`;
				const entityId = fraudNetwork?.nodes.find(
					(node) => node.type === "shared" && node.entityId,
				)?.entityId;

				await generateAndSaveEvidence({
					text: narrative,
					caseId: caseData.case._id,
					source: "Enforcement Action",
					...(entityId ? { entityId } : {}),
				});
			}
		},
		[caseData, createEnforcementAction, generateAndSaveEvidence, fraudNetwork],
	);

	return {
		caseData,
		isLoading: caseData === undefined,
		auditLogs,
		reportTimeline,
		topSignals,
		...derived,
		handleEnforcementAction,
	};
}
