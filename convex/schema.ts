import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	// USERS (Suspects / Accounts)
	users: defineTable({
		name: v.string(),
		email: v.optional(v.string()),
		accountType: v.string(), // "Retail" | "VIP" | "Merchant"
		flagged: v.boolean(),
		riskScore: v.number(), // 0–100 live aggregate
		status: v.string(), // "Active" | "Frozen" | "ShadowBanned"
		lastLoginIp: v.optional(v.string()),
		walletAddress: v.optional(v.string()),
		rawProfile: v.any(), // full JSON context for AI
	}).index("by_status", ["status"]),

	// TRANSACTIONS
	transactions: defineTable({
		userId: v.id("users"),
		amount: v.number(),
		currency: v.string(), // "USD" | "EUR" | "BTC" | "ETH"
		type: v.string(), // "Deposit" | "Withdrawal" | "Transfer"
		timestamp: v.number(), // Date.now()
		counterparty: v.optional(v.string()),
		isFraud: v.boolean(), // highlight red dots
		fraudTag: v.optional(v.string()), // "Structuring" | "RapidDrain"
		meta: v.any(), // IP, device, location
	})
		.index("by_user", ["userId"])
		.index("by_fraud", ["isFraud"])
		.index("by_timestamp", ["timestamp"]),

	// ALERTS
	alerts: defineTable({
		userId: v.id("users"),
		trigger: v.string(), // "Rapid Withdrawal" | "Structuring"
		riskScore: v.number(), // spike driver
		amount: v.number(),
		status: v.string(), // "New" | "Investigating" | "Resolved"
		createdAt: v.number(),
		isRealtime: v.boolean(), // injected demo alerts
		attackBatchId: v.optional(v.string()), // group the burst
		evidenceTxIds: v.array(v.id("transactions")), // direct proof links
	})
		.index("by_status", ["status"])
		.index("by_realtime", ["isRealtime"])
		.index("by_created", ["createdAt"]),

	// CASES (Investigation Workspace)
	cases: defineTable({
		alertId: v.id("alerts"),
		userId: v.id("users"),
		summary: v.string(), // AI case brief
		confidence: v.number(), // 0–1
		recommendedAction: v.string(), // "Freeze" | "ShadowBan" | "Monitor"
		status: v.string(), // "Open" | "Actioned" | "Closed"
		timeline: v.any(), // ordered events JSON
		createdAt: v.number(),
	}).index("by_status", ["status"]),

	// ENFORCEMENT ACTIONS
	actions: defineTable({
		caseId: v.id("cases"),
		userId: v.id("users"),
		type: v.string(), // "Freeze" | "ShadowBan" | "Release"
		executedBy: v.string(), // "System" | "Analyst"
		executedAt: v.number(),
		result: v.string(), // "Success" | "Failed"
		notes: v.optional(v.string()),
	}).index("by_user", ["userId"]),

	// RING ENTITIES
	entities: defineTable({
		type: v.string(), // "IP" | "Wallet" | "Device"
		value: v.string(),
		lastActive: v.optional(v.number()),
		riskLevel: v.optional(v.string()), // "High" | "Medium" | "Low"
	}).index("by_type", ["type"]),

	// LINKS (User <-> Shared Entity Connections)
	links: defineTable({
		userId: v.id("users"),
		entityId: v.id("entities"),
		strength: v.number(), // 0–1 connection weight
		firstSeen: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_entity", ["entityId"]),

	messages: defineTable({
		caseId: v.id("cases"),
		role: v.string(), // "user" | "assistant"
		content: v.string(),
		thoughtProcess: v.optional(v.string()),
		uiComponent: v.optional(v.string()), // "FREEZE" | "SHADOWBAN"
		relatedTxIds: v.optional(v.array(v.id("transactions"))),
		createdAt: v.number(),
	}).index("by_case", ["caseId"]),

	evidence: defineTable({
		caseId: v.optional(v.id("cases")), // Optional: general knowledge / specific case
		entityId: v.optional(v.id("entities")), // Optional: related to IP / Wallet / Device
		text: v.string(), // "Suspicious transaction of $10,000 to offshore account."
		source: v.string(), // "Transaction Note" | "System Log" | "Manual Upload"
		embedding: v.array(v.float64()),
	}).vectorIndex("by_embedding", {
		vectorField: "embedding",
		dimensions: 1024,
		filterFields: ["caseId"],
	}),
});
