import { internalQuery, internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAll } from "convex-helpers/server/relationships";
import type { Doc } from "./_generated/dataModel";

function isDefined<T>(value: T | null | undefined): value is T {
	return value !== null && value !== undefined;
}

export const gatherInvestigationData = internalQuery({
	args: { alertId: v.id("alerts") },
	handler: async (ctx, args) => {
		const alert = await ctx.db.get(args.alertId);
		if (!alert) return null;

		const [user] = await getAll(ctx.db, [alert.userId]);
		const transactions = (await getAll(ctx.db, alert.evidenceTxIds)).filter(
			isDefined,
		);

		return { alert, user: user ?? null, transactions };
	},
});

export const getCaseDetailByAlertId = query({
	args: { alertId: v.id("alerts") },
	handler: async (ctx, args) => {
		const alert = await ctx.db.get(args.alertId);
		if (!alert) return null;

		const [user] = await getAll(ctx.db, [alert.userId]);
		const transactions = (await getAll(ctx.db, alert.evidenceTxIds)).filter(
			isDefined,
		);

		const caseDocs = await ctx.db
			.query("cases")
			.withIndex("by_alert", (q) => q.eq("alertId", args.alertId))
			.collect();

		const caseDoc = caseDocs[0] ?? null;
		let actions: Doc<"actions">[] = [];

		if (caseDoc) {
			actions = await ctx.db
				.query("actions")
				.withIndex("by_case", (q) => q.eq("caseId", caseDoc._id))
				.collect();
			actions.sort((a, b) => b.executedAt - a.executedAt);
		}

		return {
			alert,
			user: user ?? null,
			case: caseDoc,
			transactions,
			actions,
		};
	},
});

export const createCaseFromAnalysis = internalMutation({
	args: {
		alertId: v.id("alerts"),
		userId: v.id("users"),
		analysis: v.any(),
	},
	handler: async (ctx, args) => {
		await ctx.db.insert("cases", {
			alertId: args.alertId,
			userId: args.userId,
			summary: args.analysis.summary,
			confidence: args.analysis.confidence,
			recommendedAction: args.analysis.recommendedAction,
			status: "Open",
			timeline: args.analysis.timeline,
			createdAt: Date.now(),
		});

		await ctx.db.patch(args.alertId, { status: "Investigating" });
	},
});
