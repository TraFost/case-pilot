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

type NetworkNode = {
	id: string;
	label: string;
	type: "suspect" | "shared" | "mule";
	entityId?: Doc<"entities">["_id"];
};

type NetworkEdge = {
	id: string;
	source: string;
	target: string;
	label?: string;
};

export const getFraudRingNetworkByAlertId = query({
	args: { alertId: v.id("alerts") },
	handler: async (ctx, args) => {
		const alert = await ctx.db.get(args.alertId);
		if (!alert) return null;

		const [primaryUser] = await getAll(ctx.db, [alert.userId]);
		if (!primaryUser) return null;

		const userLinks = await ctx.db
			.query("links")
			.withIndex("by_user", (q) => q.eq("userId", alert.userId))
			.collect();
		const entityIds = userLinks.map((link) => link.entityId);
		const entities = (await getAll(ctx.db, entityIds)).filter(isDefined);
		const entityMap = new Map(entities.map((entity) => [entity._id, entity]));
		const uniqueEntityIds = entities.map((entity) => entity._id);

		const linksByEntity = await Promise.all(
			uniqueEntityIds.map((entityId) =>
				ctx.db
					.query("links")
					.withIndex("by_entity", (q) => q.eq("entityId", entityId))
					.collect(),
			),
		);
		const links = linksByEntity.flat();

		const userIds = new Set([
			alert.userId,
			...links.map((link) => link.userId),
		]);
		const users = await getAll(ctx.db, Array.from(userIds));
		const userMap = new Map(
			users.filter(isDefined).map((user) => [user._id, user]),
		);

		const nodes: NetworkNode[] = [];
		const edges: NetworkEdge[] = [];

		const suspectId = `user-${primaryUser._id}`;
		nodes.push({
			id: suspectId,
			label: primaryUser.name,
			type: "suspect",
		});

		for (const [entityId, entity] of entityMap) {
			const entityNodeId = `entity-${entityId}`;
			nodes.push({
				id: entityNodeId,
				label: entity.value || entity.type,
				type: "shared",
				entityId: entity._id,
			});
		}

		for (const link of links) {
			const linkedUser = userMap.get(link.userId);
			if (!linkedUser) continue;
			const entity = entityMap.get(link.entityId);
			if (!entity) continue;

			const userNodeId = `user-${linkedUser._id}`;
			const entityNodeId = `entity-${entity._id}`;

			if (userNodeId !== suspectId) {
				nodes.push({
					id: userNodeId,
					label: linkedUser.name,
					type: "mule",
				});
			}

			edges.push({
				id: `${userNodeId}-${entityNodeId}`,
				source: userNodeId,
				target: entityNodeId,
				label: entity.type,
			});
		}

		const uniqueNodes = Array.from(
			new Map(nodes.map((node) => [node.id, node])).values(),
		);

		const uniqueEdges = Array.from(
			new Map(edges.map((edge) => [edge.id, edge])).values(),
		);

		return {
			nodes: uniqueNodes,
			edges: uniqueEdges,
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
