import { v } from "convex/values";
import { internalQuery } from "./_generated/server";
import { getAll } from "convex-helpers/server/relationships";

export const getUsersByIds = internalQuery({
	args: { ids: v.array(v.id("users")) },
	handler: async (ctx, args) => {
		return (await getAll(ctx.db, args.ids)).filter(Boolean);
	},
});
