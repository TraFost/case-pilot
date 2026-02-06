import { useAction, useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const EMBEDDING_ACTIONS = new Set(["FREEZE ACCOUNT", "HOLD & REVIEW"]);

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
				timestamp: new Date(action.executedAt).toLocaleString("en-US", {
					year: "numeric",
					month: "2-digit",
					day: "2-digit",
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
					hour12: false,
				}),
				action: action.type,
				actor: action.executedBy,
				justification: action.notes ?? "Automated enforcement action",
			};
		});
	}, [caseData?.actions]);

	const transactionTimeline = useMemo<TransactionTimelineItem[]>(() => {
		if (!caseData?.transactions) return [];

		return [...caseData.transactions]
			.sort((a, b) => b.timestamp - a.timestamp)
			.map((tx) => {
				const timestamp = new Date(tx.timestamp);
				const time = timestamp.toLocaleTimeString("en-US", {
					hour: "2-digit",
					minute: "2-digit",
				});
				const highlight = Boolean(tx.isFraud || tx.fraudTag);
				const note = tx.fraudTag
					? `Suspicious: ${tx.fraudTag}`
					: highlight
						? "Suspicious activity flagged"
						: "Normal activity";

				return {
					time,
					amount: `$${tx.amount.toFixed(2)}`,
					type: tx.type,
					note,
					highlight,
				};
			});
	}, [caseData?.transactions]);

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

	const handleEnforcementAction = useCallback(
		async (actionName: string) => {
			if (!caseData?.case || !caseData.user) return;

			const executedAt = Date.now();
			await createEnforcementAction({
				caseId: caseData.case._id,
				userId: caseData.user._id,
				type: actionName,
				executedBy: "Analyst",
				executedAt,
				result: "Success",
			});

			if (EMBEDDING_ACTIONS.has(actionName)) {
				const text = `Enforcement action executed: ${actionName}. User: ${caseData.user.name}. Alert: ${caseData.alert._id}. Risk score: ${caseData.alert.riskScore}.`;
				await generateAndSaveEvidence({
					text,
					caseId: caseData.case._id,
					source: "Enforcement Action",
				});
			}
		},
		[caseData, createEnforcementAction, generateAndSaveEvidence],
	);

	return {
		caseData,
		isLoading: caseData === undefined,
		auditLogs,
		transactionTimeline,
		reportTimeline,
		topSignals,
		handleEnforcementAction,
	};
}
