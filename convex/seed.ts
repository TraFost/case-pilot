import { mutation } from "./_generated/server";
import { v } from "convex/values";
import {
	rand,
	randEmail,
	randFullName,
	randNumber,
	randFloat,
	randBoolean,
	randIp,
	randRecentDate,
	randCompanyName,
	randBitcoinAddress,
	randEthereumAddress,
	randAccount,
	randCountry,
	randCountryCode,
	randAddress,
} from "@ngneat/falso";

const USER_STATUS = ["Active", "Frozen", "ShadowBanned"];
const TX_TYPES = ["Deposit", "Withdrawal", "Transfer"];
const ALERT_STATUS = ["New", "Investigating", "Resolved"];
const ENTITY_TYPES = ["IP", "Wallet", "Device"];
const FRAUD_TAGS = [
	"Structuring",
	"RapidDrain",
	"GeoAnomaly",
	"VelocitySpike",
	"MuleNetwork",
];
const TRIGGERS = [
	"Rapid Withdrawal",
	"Structuring Pattern",
	"Geographic Anomaly",
	"Velocity Check",
];
const DEVICES = ["iPhone", "Android", "Mac", "Windows"];

function generateCurrencyCode() {
	return rand(["USD", "EUR", "BTC", "ETH"]);
}

export const seed = mutation({
	args: {
		userCount: v.optional(v.number()),
		txPerUser: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const userCount = args.userCount ?? 18;
		const userIds: any[] = [];

		console.log(`Starting seed for ${userCount} users...`);

		// ---------------- USERS + TRANSACTIONS ----------------
		for (let i = 0; i < userCount; i++) {
			const isFlagged = randBoolean();

			const riskScore = isFlagged
				? randNumber({ min: 65, max: 98 })
				: randNumber({ min: 5, max: 60 });

			const userId = await ctx.db.insert("users", {
				name: randFullName(),
				email: randEmail(),
				flagged: isFlagged,
				riskScore,
				status: rand(USER_STATUS),
				lastLoginIp: randIp(),
				walletAddress: rand([
					randBitcoinAddress(),
					randEthereumAddress(),
					randAccount(),
				]),
				rawProfile: {
					country: randCountryCode(),
					device: rand(DEVICES),
				},
			});

			userIds.push(userId);

			const txCount = args.txPerUser ?? 10;
			const userTxIds: any[] = [];

			for (let j = 0; j < txCount; j++) {
				const isFraud = randBoolean();
				const locationCountryCode = randCountryCode();

				const amount = isFraud
					? randFloat({ min: 3000, max: 25000, fraction: 2 })
					: randFloat({ min: 20, max: 2000, fraction: 2 });

				const txId = await ctx.db.insert("transactions", {
					userId,
					amount,
					currency: generateCurrencyCode(),
					type: rand(TX_TYPES),
					timestamp: randRecentDate().getTime(),
					counterparty: randBoolean() ? randCompanyName() : undefined,
					isFraud,
					fraudTag: isFraud ? rand(FRAUD_TAGS) : undefined,
					meta: {
						ip: randIp(),
						device: rand(DEVICES),
						location: {
							countryCode: locationCountryCode,
							country: randCountry(),
							address: randAddress(),
						},
					},
				});

				if (isFraud) userTxIds.push(txId);
			}

			if (isFlagged || userTxIds.length > 0) {
				await ctx.db.insert("alerts", {
					userId,
					trigger: rand(TRIGGERS),
					riskScore,
					amount: randFloat({ min: 100, max: 50000, fraction: 2 }),
					status: rand(["New", "New", "Investigating", "Resolved"]),
					createdAt: randRecentDate().getTime(),
					evidenceTxIds: userTxIds.slice(0, 3),
				});
			}
		}

		// ---------------- ENTITIES ----------------
		const entityIds: any[] = [];
		const highRiskEntityIds: any[] = [];

		for (let k = 0; k < 22; k++) {
			const entityType = rand(ENTITY_TYPES);
			let entityValue: string;

			if (entityType === "IP") {
				entityValue = randIp();
			} else if (entityType === "Wallet") {
				entityValue = rand([
					randBitcoinAddress(),
					randEthereumAddress(),
					randAccount(),
				]);
			} else {
				const deviceType = rand(DEVICES);
				const deviceId = Math.random().toString(16).slice(2, 14);
				entityValue = `${deviceType}::${deviceId}`;
			}

			const riskLevel = rand(["High", "High", "Medium", "Low"]);

			const entId = await ctx.db.insert("entities", {
				type: entityType,
				value: entityValue,
				lastActive: randRecentDate().getTime(),
				riskLevel,
			});

			entityIds.push(entId);
			if (riskLevel === "High") highRiskEntityIds.push(entId);
		}

		const sharedEntities =
			highRiskEntityIds.length > 0 ? highRiskEntityIds : entityIds.slice(0, 6);

		// ---------------- FRAUD RINGS ----------------
		const ringCount = 2;
		const remainingUsers = [...userIds];

		for (let ringIndex = 0; ringIndex < ringCount; ringIndex++) {
			const ringSize = randNumber({ min: 4, max: 5 });
			const ringUsers = remainingUsers.splice(0, ringSize);
			if (!ringUsers.length) break;

			const ringEntityCount = randNumber({ min: 2, max: 4 });
			const ringEntities = Array.from({ length: ringEntityCount }, () =>
				rand(sharedEntities),
			);

			for (const userId of ringUsers) {
				for (const entityId of ringEntities) {
					await ctx.db.insert("links", {
						userId,
						entityId,
						strength: Math.round(randFloat({ min: 0.75, max: 1 }) * 100) / 100,
						firstSeen: randRecentDate().getTime(),
					});
				}

				const personalCount = randNumber({ min: 1, max: 2 });

				for (let i = 0; i < personalCount; i++) {
					await ctx.db.insert("links", {
						userId,
						entityId: rand(entityIds),
						strength: Math.round(randFloat({ min: 0.2, max: 0.7 }) * 100) / 100,
						firstSeen: randRecentDate().getTime(),
					});
				}
			}
		}

		// ---------------- RANDOM LINKS ----------------
		for (const userId of userIds) {
			const linkCount = randNumber({ min: 1, max: 2 });

			for (let i = 0; i < linkCount; i++) {
				const entityId = rand(entityIds);

				await ctx.db.insert("links", {
					userId,
					entityId,
					strength: Math.round(randFloat({ min: 0.2, max: 1 }) * 100) / 100,
					firstSeen: randRecentDate().getTime(),
				});
			}
		}

		console.log("Seed Done! Database filled with demo-balanced data.");
	},
});

export const clear = mutation({
	args: {},
	handler: async (ctx) => {
		const tables = [
			"users",
			"transactions",
			"alerts",
			"links",
			"entities",
			"actions",
			"evidence",
			"cases",
		];

		for (const table of tables) {
			const docs = await ctx.db.query(table as any).collect();
			for (const doc of docs) {
				await ctx.db.delete(doc._id);
			}
		}

		console.log("Database Cleared.");
	},
});
