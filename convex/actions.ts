import { internalQuery, mutation } from "./_generated/server";
import { v } from "convex/values";

export const createEnforcementAction = mutation({
	args: {
		caseId: v.id("cases"),
		alertId: v.optional(v.id("alerts")),
		userId: v.id("users"),
		type: v.string(),
		executedBy: v.string(),
		executedAt: v.number(),
		result: v.string(),
		notes: v.optional(v.string()),
		userStatus: v.optional(v.string()),
		caseStatus: v.optional(v.string()),
		alertStatus: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const actionId = await ctx.db.insert("actions", {
			caseId: args.caseId,
			userId: args.userId,
			type: args.type,
			executedBy: args.executedBy,
			executedAt: args.executedAt,
			result: args.result,
			notes: args.notes,
		});

		if (args.userStatus) {
			await ctx.db.patch(args.userId, { status: args.userStatus });
		}
		if (args.caseStatus) {
			await ctx.db.patch(args.caseId, { status: args.caseStatus });
		}
		if (args.alertId && args.alertStatus) {
			await ctx.db.patch(args.alertId, { status: args.alertStatus });
		}

		return actionId;
	},
});

export const getLatestActionByCaseId = internalQuery({
	args: { caseId: v.id("cases") },
	handler: async (ctx, args) => {
		const actions = await ctx.db
			.query("actions")
			.withIndex("by_case", (q) => q.eq("caseId", args.caseId))
			.collect();
		if (!actions.length) return null;
		actions.sort((a, b) => b.executedAt - a.executedAt);
		return actions[0];
	},
});
