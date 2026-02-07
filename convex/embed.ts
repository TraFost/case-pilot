import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const saveEvidence = internalMutation({
	args: {
		text: v.string(),
		embedding: v.array(v.float64()),
		caseId: v.optional(v.id("cases")),
		source: v.string(),
		entityId: v.optional(v.id("entities")),
	},
	handler: async (ctx, args) => {
		await ctx.db.insert("evidence", {
			text: args.text,
			embedding: args.embedding,
			caseId: args.caseId,
			source: args.source,
			entityId: args.entityId,
		});
	},
});
