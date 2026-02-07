"use node";

import { generateText, Output } from "ai";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { v } from "convex/values";
import { z } from "zod";

import { mainModel } from "./ai_config";

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

type Currency = "BTC" | "ETH" | "USD" | "EUR";

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
