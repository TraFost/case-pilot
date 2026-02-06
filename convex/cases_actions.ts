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

		console.log(`AI Analyzing Alert for User: ${data.user.name}...`);

		const { output }: { output: CaseAnalysis } = await generateText({
			model: mainModel,
			output: Output.object({
				schema: CaseAnalysisSchema,
			}),
			prompt: `
            ROLE: Senior Financial Crime Investigator.

            TASK: Analyze the following suspicious activity report and determine the risk.

            CONTEXT DATA:
			User: ${JSON.stringify(data.user)}
			Trigger: ${data.alert.trigger}
			Suspicious Transactions: ${JSON.stringify(data.transactions)}

            INSTRUCTIONS:
            - Look for patterns like Structuring (smurfing), Rapid Drain, or weird IP usage.
            - Be professional and concise.`,
		});

		await ctx.runMutation(internal.cases.createCaseFromAnalysis, {
			alertId: args.alertId,
			userId: data.user._id,
			analysis: output,
		});

		return output;
	},
});
