import { useAction, useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatAuditTimestamp, formatDateTime } from "@/utils/date.util";
import {
	formatCurrencyWithCode,
	getCurrencyFromWalletAddress,
	normalizeCurrency,
} from "@/utils/currency.util";

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

	const transactionTimeline = useMemo<TransactionTimelineItem[]>(() => {
		if (!caseData?.transactions) return [];
		const walletCurrency = getCurrencyFromWalletAddress(
			caseData.user?.walletAddress ?? null,
		);

		return [...caseData.transactions]
			.sort((a, b) => b.timestamp - a.timestamp)
			.map((tx) => {
				const time = formatDateTime(tx.timestamp);
				const currency = normalizeCurrency(tx.currency ?? walletCurrency);
				const highlight = Boolean(tx.isFraud || tx.fraudTag);
				const note = tx.fraudTag
					? `Suspicious: ${tx.fraudTag}`
					: highlight
						? "Suspicious activity flagged"
						: "Normal activity";

				return {
					time,
					amount: formatCurrencyWithCode(tx.amount, currency),
					type: tx.type,
					note,
					highlight,
				};
			});
	}, [caseData?.transactions, caseData?.user?.walletAddress]);

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
				const entityId = fraudNetwork?.nodes.find(
					(node) => node.type === "shared" && node.entityId,
				)?.entityId;
				await generateAndSaveEvidence({
					text,
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
		transactionTimeline,
		reportTimeline,
		topSignals,
		handleEnforcementAction,
	};
}
