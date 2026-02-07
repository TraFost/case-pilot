import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAll } from "convex-helpers/server/relationships";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const ATTACK_TRIGGERS = [
	"Rapid Withdrawal",
	"Structuring Pattern",
	"Geographic Anomaly",
	"Velocity Check",
];
const ATTACK_TX_TYPES = ["Withdrawal", "Transfer"];
const ATTACK_FRAUD_TAGS = [
	"RapidDrain",
	"Structuring",
	"VelocitySpike",
	"MuleNetwork",
];
const ATTACK_DEVICES = ["iPhone", "Android", "Mac", "Windows"];
const ATTACK_CURRENCIES = ["USD", "EUR", "BTC", "ETH"];
const ATTACK_ENTITY_TYPES = ["IP", "Wallet", "Device"] as const;

function pickRandom<T>(items: readonly T[]) {
	return items[Math.floor(Math.random() * items.length)];
}

function randomAmount(min: number, max: number) {
	return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function randomHex(length: number) {
	const chars = "0123456789abcdef";
	let value = "";
	for (let i = 0; i < length; i += 1) {
		value += chars[Math.floor(Math.random() * chars.length)];
	}
	return value;
}

function randomStrength(min: number, max: number) {
	return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

export const getAllTasks = query({
	handler: async (ctx) => {
		const alerts = await ctx.db
			.query("alerts")
			.withIndex("by_created")
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

export const insertAttackAlert = mutation({
	args: {
		userId: v.id("users"),
		createdAt: v.number(),
		sharedEntityIds: v.optional(v.array(v.id("entities"))),
		sharedIp: v.optional(v.string()),
		sharedDevice: v.optional(v.string()),
		sharedWallet: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const user = await ctx.db.get(args.userId);
		if (!user) return null;
		const createdAt = args.createdAt + Math.floor(Math.random() * 500);

		const fraudTxCount = 2 + Math.floor(Math.random() * 2);
		const evidenceTxIds: Id<"transactions">[] = [];
		const userCountry =
			typeof user.rawProfile === "object" && user.rawProfile?.country
				? String(user.rawProfile.country)
				: "US";

		for (let i = 0; i < fraudTxCount; i += 1) {
			const txId = await ctx.db.insert("transactions", {
				userId: args.userId,
				amount: randomAmount(4000, 45000),
				currency: pickRandom(ATTACK_CURRENCIES),
				type: pickRandom(ATTACK_TX_TYPES),
				timestamp: createdAt + i * 1000,
				counterparty: args.sharedWallet ?? "Offshore Transfer",
				isFraud: true,
				fraudTag: pickRandom(ATTACK_FRAUD_TAGS),
				meta: {
					ip:
						args.sharedIp ?? `203.0.113.${Math.floor(Math.random() * 200) + 1}`,
					device: args.sharedDevice ?? pickRandom(ATTACK_DEVICES),
					sharedWallet: args.sharedWallet ?? null,
					location: {
						countryCode: userCountry,
						country: userCountry,
						address: "Rapid withdrawal cluster",
					},
				},
			});
			evidenceTxIds.push(txId);
		}

		const sharedEntityIds = args.sharedEntityIds ?? [];
		for (const entityId of sharedEntityIds) {
			await ctx.db.insert("links", {
				userId: args.userId,
				entityId,
				strength: randomStrength(0.75, 1),
				firstSeen: createdAt,
			});
		}

		const personalEntityType = pickRandom(ATTACK_ENTITY_TYPES);
		const personalEntityValue =
			personalEntityType === "IP"
				? `203.0.113.${Math.floor(Math.random() * 200) + 1}`
				: personalEntityType === "Wallet"
					? `0x${randomHex(16)}`
					: `${pickRandom(ATTACK_DEVICES)}::${randomHex(6)}`;
		const personalEntityId = await ctx.db.insert("entities", {
			type: personalEntityType,
			value: personalEntityValue,
			lastActive: createdAt,
			riskLevel: "Medium",
		});
		await ctx.db.insert("links", {
			userId: args.userId,
			entityId: personalEntityId,
			strength: randomStrength(0.3, 0.7),
			firstSeen: createdAt,
		});

		return ctx.db.insert("alerts", {
			userId: args.userId,
			trigger: pickRandom(ATTACK_TRIGGERS),
			riskScore: 90 + Math.floor(Math.random() * 10),
			amount: randomAmount(10000, 120000),
			status: "New",
			createdAt,
			evidenceTxIds: evidenceTxIds.slice(0, 3),
		});
	},
});

export const injectAttack = mutation({
	args: {},
	handler: async (ctx) => {
		const users = await ctx.db.query("users").take(50);
		if (!users.length) return { scheduled: 0 };

		const now = Date.now();
		const thirtyMinutesMs = 30 * 60 * 1000;
		const sharedIp = `203.0.113.${Math.floor(Math.random() * 200) + 1}`;
		const sharedWallet = `0x${randomHex(20)}`;
		const sharedDevice = `${pickRandom(ATTACK_DEVICES)}::${randomHex(8)}`;
		const sharedEntityIds = [
			await ctx.db.insert("entities", {
				type: "IP",
				value: sharedIp,
				lastActive: now,
				riskLevel: "High",
			}),
			await ctx.db.insert("entities", {
				type: "Wallet",
				value: sharedWallet,
				lastActive: now,
				riskLevel: "High",
			}),
			await ctx.db.insert("entities", {
				type: "Device",
				value: sharedDevice,
				lastActive: now,
				riskLevel: "High",
			}),
		];
		const alertCount = 5 + Math.floor(Math.random() * 6);
		const delays = Array.from({ length: alertCount }, (_, index) =>
			Math.round((index / Math.max(1, alertCount - 1)) * 5000),
		);

		for (let i = 0; i < alertCount; i += 1) {
			const user = users[Math.floor(Math.random() * users.length)];
			const createdAt = now - Math.floor(Math.random() * thirtyMinutesMs);
			await ctx.scheduler.runAfter(delays[i], api.alerts.insertAttackAlert, {
				userId: user._id,
				createdAt,
				sharedEntityIds,
				sharedIp,
				sharedDevice,
				sharedWallet,
			});
		}

		return { scheduled: alertCount };
	},
});
