"use node";

import { embed, generateText, Output } from "ai";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { v } from "convex/values";
import { z } from "zod";

import { embeddingModel, mainModel } from "./ai_config";

const CaseAnalysisSchema = z.object({
	summary: z
		.string()
		.describe("A concise executive summary of the fraud patterns detected."),
	confidence: z
		.number()
		.min(0)
		.max(1)
		.describe("Confidence score between 0 and 1."),
	recommendedAction: z.enum(["Freeze", "ShadowBan", "Monitor", "Clear"]),
	timeline: z.array(
		z.object({
			event: z.string(),
			time: z
				.string()
				.describe("ISO string or description of time relative to now"),
		}),
	),
});

type CaseAnalysis = z.infer<typeof CaseAnalysisSchema>;

type InvestigationData = {
	alert: Doc<"alerts">;
	user: Doc<"users"> | null;
	transactions: Doc<"transactions">[];
};

type SimilarCaseMatch = {
	caseId: Doc<"cases">["_id"];
	caseSummary: string;
	caseStatus: string;
	userName: string;
	outcome: string;
	outcomeNotes: string | null;
	similarity: number;
	evidenceText: string;
};

type Currency = "BTC" | "ETH" | "USD" | "EUR";

function isDefined<T>(value: T | null | undefined): value is T {
	return value !== null && value !== undefined;
}

const WALLET_PREFIXES: Array<{ prefix: string; currency: Currency }> = [
	{ prefix: "0x", currency: "ETH" },
	{ prefix: "bc1", currency: "BTC" },
	{ prefix: "1", currency: "BTC" },
	{ prefix: "3", currency: "BTC" },
];

function normalizeCurrency(value: string | null | undefined): Currency {
	if (!value) return "USD";
	const upper = value.toUpperCase();
	if (
		upper === "BTC" ||
		upper === "ETH" ||
		upper === "USD" ||
		upper === "EUR"
	) {
		return upper as Currency;
	}
	return "USD";
}

function getCurrencyFromWalletAddress(walletAddress: string | null): Currency {
	if (!walletAddress) return "USD";
	const trimmed = walletAddress.trim().toLowerCase();
	const match = WALLET_PREFIXES.find((entry) =>
		trimmed.startsWith(entry.prefix),
	);
	return match?.currency ?? "USD";
}

function formatAmount(amount: number, currency: Currency) {
	if (currency === "BTC" || currency === "ETH") {
		return new Intl.NumberFormat("en-US", {
			style: "decimal",
			minimumFractionDigits: 2,
			maximumFractionDigits: 8,
		}).format(amount);
	}

	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
		minimumFractionDigits: 2,
	}).format(amount);
}

export const analyzeAlert = action({
	args: { alertId: v.id("alerts") },
	handler: async (ctx, args): Promise<CaseAnalysis> => {
		const data: InvestigationData | null = await ctx.runQuery(
			internal.cases.gatherInvestigationData,
			{
				alertId: args.alertId,
			},
		);

		if (!data) throw new Error("Alert data not found");
		if (!data.user) throw new Error("Alert user not found");
		const alertCurrency = getCurrencyFromWalletAddress(data.user.walletAddress);
		const formattedAlertAmount = formatAmount(data.alert.amount, alertCurrency);
		const formattedTransactions = data.transactions.map((tx) => {
			const txCurrency = normalizeCurrency(tx.currency);
			return {
				...tx,
				timestampISO: new Date(tx.timestamp).toISOString(),
				amountFormatted: `${formatAmount(tx.amount, txCurrency)} ${txCurrency}`,
			};
		});

		console.log(`AI Analyzing Alert for User: ${data.user.name}...`);

		const { output }: { output: CaseAnalysis } = await generateText({
			model: mainModel,
			temperature: 0.2,
			output: Output.object({
				schema: CaseAnalysisSchema,
			}),
			prompt: `
            ROLE: Senior Financial Crime Investigator.

            OBJECTIVE:
			Determine whether this alert indicates coordinated fraud,
			account takeover, structuring, or benign behavior.

			Return structured analysis only.

			ALERT:
			Trigger: ${data.alert.trigger}
			RiskScore: ${data.alert.riskScore}
			Amount: ${formattedAlertAmount} (${alertCurrency})
			WalletCurrency: ${alertCurrency}
					
			TRANSACTIONS (sample):
			${JSON.stringify(formattedTransactions)}
					
			INSTRUCTIONS:
			- Identify concrete fraud patterns.
			- Reference transaction behavior.
			- Keep summary under 120 words.
			- Timeline must be chronological.
			- Timeline time MUST exactly match a transaction timestampISO from the list.
			- recommendedAction must reflect risk severity.`,
		});

		await ctx.runMutation(internal.cases.createCaseFromAnalysis, {
			alertId: args.alertId,
			userId: data.user._id,
			analysis: output,
		});

		return output;
	},
});

export const findSimilarCases = action({
	args: { caseId: v.id("cases") },
	handler: async (ctx, args): Promise<SimilarCaseMatch[]> => {
		const currentCase = await ctx.runQuery(internal.cases.getCaseById, {
			caseId: args.caseId,
		});
		if (!currentCase?.summary) return [];

		let embedding: number[];
		try {
			const result = await embed({
				model: embeddingModel,
				value: currentCase.summary,
			});
			embedding = result.embedding;
		} catch (error) {
			console.error("Similar case embedding failed", error);
			return [];
		}

		if (embedding.length !== 1024) {
			console.error(
				`WARNING: Embedding dimension mismatch! Got ${embedding.length}, expected 1024.`,
			);
		}

		const results = await ctx.vectorSearch("evidence", "by_embedding", {
			vector: embedding,
			limit: 5,
		});

		if (!results.length) return [];

		const evidenceIds = results.map((result) => result._id);
		const evidencesRaw = await ctx.runQuery(
			internal.evidence.fetchEvidenceByIds,
			{
				ids: evidenceIds,
			},
		);
		const evidences = evidencesRaw.filter(isDefined);
		const filteredEvidences = evidences.filter(
			(doc): doc is Doc<"evidence"> & { caseId: Doc<"cases">["_id"] } =>
				Boolean(doc.caseId) && doc.caseId !== args.caseId,
		);

		if (!filteredEvidences.length) return [];

		const evidenceMap = new Map(filteredEvidences.map((doc) => [doc._id, doc]));
		const relatedCaseIds = Array.from(
			new Set(filteredEvidences.map((doc) => doc.caseId)),
		);

		const relatedCases: Doc<"cases">[] = relatedCaseIds.length
			? await ctx.runQuery(internal.cases.getCasesByIds, {
					ids: relatedCaseIds,
				})
			: [];
		const caseMap = new Map(relatedCases.map((doc) => [doc._id, doc]));

		const relatedUserIds = Array.from(
			new Set(relatedCases.map((doc) => doc.userId)),
		);
		const relatedUsersRaw = relatedUserIds.length
			? await ctx.runQuery(internal.users.getUsersByIds, {
					ids: relatedUserIds,
				})
			: [];
		const relatedUsers = relatedUsersRaw.filter(isDefined);
		const userMap = new Map(relatedUsers.map((user) => [user._id, user]));

		const actionLookups = await Promise.all(
			relatedCaseIds.map(async (caseId) => {
				const action = await ctx.runQuery(
					internal.actions.getLatestActionByCaseId,
					{ caseId },
				);
				return [caseId, action] as const;
			}),
		);
		const actionMap = new Map(actionLookups);

		return results
			.map((result): SimilarCaseMatch | null => {
				const evidence = evidenceMap.get(result._id);
				if (!evidence?.caseId) return null;
				const relatedCase = caseMap.get(evidence.caseId);
				if (!relatedCase) return null;
				const relatedUser = userMap.get(relatedCase.userId);
				const latestAction = actionMap.get(relatedCase._id);

				return {
					caseId: relatedCase._id,
					caseSummary: relatedCase.summary,
					caseStatus: relatedCase.status,
					userName: relatedUser?.name ?? "Unknown",
					outcome: latestAction?.type ?? "Unknown",
					outcomeNotes: latestAction?.notes ?? null,
					similarity: Math.round(result._score * 100),
					evidenceText: evidence.text,
				};
			})
			.filter((item): item is SimilarCaseMatch => Boolean(item));
	},
});
