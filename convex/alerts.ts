import { query } from "./_generated/server";
import { getAll } from "convex-helpers/server/relationships";

export const getAllTasks = query({
	handler: async (ctx) => {
		const alerts = await ctx.db
			.query("alerts")
			.withIndex("by_riskScore")
			.order("desc")
			.collect();

		const userIds = alerts.map((a) => a.userId);
		const users = await getAll(ctx.db, userIds);

		const userMap = new Map(users.filter(Boolean).map((u) => [u!._id, u]));

		return alerts.map((alert) => {
			const user = userMap.get(alert.userId);

			return {
				...alert,
				username: user?.name ?? null,
			};
		});
	},
});
