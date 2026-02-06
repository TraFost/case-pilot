"use node";

import { v } from "convex/values";
import { embed } from "ai";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

import { embeddingModel } from "./ai_config";

export const generateAndSaveEvidence = action({
	args: {
		text: v.string(),
		caseId: v.optional(v.id("cases")),
		source: v.string(),
	},
	handler: async (ctx, args) => {
		const { embedding } = await embed({
			model: embeddingModel,
			value: args.text,
		});

		if (embedding.length !== 1024) {
			console.error(
				`WARNING: Embedding dimension mismatch! Got ${embedding.length}, expected 1024.`,
			);
		}

		await ctx.runMutation(internal.embed.saveEvidence, {
			text: args.text,
			embedding: embedding,
			caseId: args.caseId,
			source: args.source,
		});
	},
});
