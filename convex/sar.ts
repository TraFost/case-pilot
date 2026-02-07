"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { generateText } from "ai";
import { internal } from "./_generated/api";

import { mainModel } from "./ai_config";

type SarReport = {
	subjectName: string;
	subjectId: string;
	riskScore: number;
	trigger: string;
	reportDate: string;
	narrative: string;
};

type EvidenceTransaction = {
	amount: number;
	currency: string;
	type: string;
	timestamp: number;
	counterparty?: string;
	meta?: {
		ip?: string;
		device?: string;
		location?: {
			countryCode?: string;
			country?: string;
			address?: string;
		};
	};
};

function formatUtc(timestamp: number) {
	return new Date(timestamp)
		.toISOString()
		.replace("T", " ")
		.replace("Z", " UTC");
}

function formatTransaction(tx: EvidenceTransaction) {
	const location =
		tx.meta?.location?.countryCode || tx.meta?.location?.country || "Unknown";
	const ip = tx.meta?.ip ?? "Unknown";
	const device = tx.meta?.device ?? "Unknown";
	const counterparty = tx.counterparty ?? "Unknown";
	return `${formatUtc(tx.timestamp)}: ${tx.type} ${tx.amount} ${tx.currency} | Counterparty: ${counterparty} | IP: ${ip} | Device: ${device} | Location: ${location}`;
}

function shortId(id: string) {
	return id.slice(-6);
}

export const generateSarReport = action({
	args: {
		alertId: v.id("alerts"),
	},
	handler: async (ctx, args): Promise<SarReport> => {
		const caseData = await ctx.runQuery(
			internal.cases.gatherInvestigationData,
			{
				alertId: args.alertId,
			},
		);

		if (!caseData?.alert || !caseData.user) {
			throw new Error("Alert data not found");
		}

		const subjectName = caseData.user.name;
		const subjectId = shortId(caseData.user._id);
		const riskScore = caseData.alert.riskScore;
		const trigger = caseData.alert.trigger;
		const reportDate = new Date().toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});

		const transactions = Array.isArray(caseData.transactions)
			? (caseData.transactions as EvidenceTransaction[])
			: [];
		const formattedTransactions = transactions
			.slice(0, 6)
			.map((tx) => formatTransaction(tx))
			.join("\n");

		const prompt = `Generate a formal SAR Narrative for user ${subjectName} (UID: ${subjectId}).\nFocus on the \"${trigger}\" trigger and the recent transactions listed.\nUse standard FinCEN narrative format with sections I-IV.\nReturn only the narrative content, starting with \"CONFIDENTIAL - SUSPICIOUS ACTIVITY REPORT NARRATIVE\".\n\nReport Metadata:\n- Subject Name: ${subjectName}\n- Subject ID: ${subjectId}\n- Risk Score: ${riskScore}\n- Trigger: ${trigger}\n- Date of Report: ${reportDate}\n\nTransactions:\n${formattedTransactions}`;

		const { text } = await generateText({
			model: mainModel,
			temperature: 0.2,
			prompt,
		});

		return {
			subjectName,
			subjectId,
			riskScore,
			trigger,
			reportDate,
			narrative: text.trim(),
		};
	},
});
