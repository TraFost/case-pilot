"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { embed, generateText } from "ai";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";

import { embeddingModel, mainModel } from "./ai_config";

type ChatResponse = {
	content: string;
	uiComponent?: "REPORT";
	sources?: SourceSection[];
};

type ModelMessage = {
	role: "system" | "user" | "assistant";
	content: string;
};

type EvidenceTransaction = {
	amount: number;
	currency: string;
	type: string;
	timestamp: number;
	counterparty?: string;
	meta?: {
		ip?: string;
		device?: string;
		location?: {
			countryCode?: string;
			country?: string;
			address?: string;
		};
	};
};

type SourceSection = {
	title: string;
	items: string[];
};

type RetrievedEvidence = {
	_id: Doc<"evidence">["_id"];
	caseId?: Doc<"cases">["_id"];
	text: string;
};

function detectUiComponent(input: string): ChatResponse["uiComponent"] {
	const lowered = input.toLowerCase();
	if (lowered.includes("report") || lowered.includes("sar")) return "REPORT";
	return undefined;
}

function getMessageText(message: any): string {
	if (typeof message?.content === "string") return message.content;
	if (!Array.isArray(message?.parts)) return "";
	return message.parts
		.filter(
			(part: any) => part?.type === "text" && typeof part.text === "string",
		)
		.map((part: any) => part.text)
		.join("");
}

function formatTransaction(tx: EvidenceTransaction) {
	const now = Date.now();
	const deltaMs = Math.max(0, now - tx.timestamp);
	const minutes = Math.floor(deltaMs / 60000);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	const relativeTime =
		days > 0
			? `${days} day${days === 1 ? "" : "s"} ago`
			: hours > 0
				? `${hours} hour${hours === 1 ? "" : "s"} ago`
				: `${Math.max(1, minutes)} min ago`;
	const location =
		tx.meta?.location?.countryCode || tx.meta?.location?.country || "Unknown";
	const ip = tx.meta?.ip ?? "Unknown";
	const device = tx.meta?.device ?? "Unknown";
	const counterparty = tx.counterparty ?? "Unknown";
	const direction = tx.type === "Deposit" ? "⬇️" : "⬆️";

	return `${direction} ${tx.type} ${tx.amount} ${tx.currency} • ${relativeTime} • Counterparty: ${counterparty} • IP: ${ip} • Device: ${device} • Location: ${location}`;
}

function toRadians(value: number) {
	return (value * Math.PI) / 180;
}

function haversineKm(a: [number, number], b: [number, number]) {
	const [lon1, lat1] = a;
	const [lon2, lat2] = b;
	const r = 6371;
	const dLat = toRadians(lat2 - lat1);
	const dLon = toRadians(lon2 - lon1);
	const lat1Rad = toRadians(lat1);
	const lat2Rad = toRadians(lat2);

	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) ** 2;
	return 2 * r * Math.asin(Math.sqrt(h));
}

function summarizeGeographicAnomaly(transactions: EvidenceTransaction[]) {
	const points = transactions
		.map((tx) => {
			const location = tx.meta?.location as
				| { countryCode?: string; country?: string; lat?: number; lon?: number }
				| undefined;
			if (!location || typeof location !== "object") return null;
			if (
				typeof location.lat !== "number" ||
				typeof location.lon !== "number"
			) {
				return null;
			}
			return {
				coords: [location.lon, location.lat] as [number, number],
				timestamp: tx.timestamp,
				label: location.countryCode || location.country || "Unknown",
			};
		})
		.filter((point): point is NonNullable<typeof point> => Boolean(point));

	if (points.length < 2) return null;

	let best: {
		a: (typeof points)[number];
		b: (typeof points)[number];
		distance: number;
	} | null = null;

	for (let i = 0; i < points.length; i += 1) {
		for (let j = i + 1; j < points.length; j += 1) {
			const distance = haversineKm(points[i].coords, points[j].coords);
			if (!best || distance > best.distance) {
				best = { a: points[i], b: points[j], distance };
			}
		}
	}

	if (!best) return null;
	const timeDeltaMs = Math.abs(best.a.timestamp - best.b.timestamp);
	const hours = Math.max(0.01, timeDeltaMs / (1000 * 60 * 60));
	const speed = Math.round(best.distance / hours);
	const speedLabel = speed > 1000 ? "SUPERHUMAN SPEED" : `${speed} km/h`;

	return `Geographic anomaly: ${best.a.label} -> ${best.b.label}, ${Math.round(
		best.distance,
	)} km in ${Math.round(hours * 10) / 10}h (~${speedLabel}).`;
}

function sanitizeEvidenceText(text: string) {
	return text.replace(/\s+/g, " ").trim();
}

function shortId(id: string) {
	return id.slice(-6);
}

function buildEvidenceSections(
	currentEvidence: RetrievedEvidence[],
	similarEvidence: RetrievedEvidence[],
	caseMap: Map<Doc<"cases">["_id"], Doc<"cases">>,
) {
	const sections: string[] = [];
	const sources: SourceSection[] = [];

	if (currentEvidence.length) {
		const items = currentEvidence.map((evidence) =>
			sanitizeEvidenceText(evidence.text),
		);
		const lines = items.map((text) => `- ${text}`).join("\n");
		sections.push(`Current Case Evidence:\n${lines}`);
		sources.push({ title: "Current Case Evidence", items });
	}

	if (similarEvidence.length) {
		const items = similarEvidence.map((evidence) => {
			const caseDoc = evidence.caseId
				? caseMap.get(evidence.caseId)
				: undefined;
			const caseLabel = evidence.caseId
				? `Case ${shortId(evidence.caseId)}`
				: "Case";
			const status = caseDoc?.status ? ` (${caseDoc.status})` : "";
			return `${caseLabel}${status}: ${sanitizeEvidenceText(evidence.text)}`;
		});
		const lines = items.map((text) => `- ${text}`).join("\n");
		sections.push(`Similar Case Evidence:\n${lines}`);
		sources.push({ title: "Similar Case Evidence", items });
	}

	if (!sections.length) return { promptSection: null, sources: [] };
	return { promptSection: sections.join("\n\n"), sources };
}

export const sendMessage = action({
	args: {
		messages: v.any(),
		caseId: v.optional(v.id("cases")),
		alertId: v.optional(v.id("alerts")),
		pageContext: v.string(),
	},
	handler: async (ctx, args): Promise<ChatResponse> => {
		let systemPrompt = "You are CasePilot, an AI fraud investigation copilot.";
		let caseIdForRag: Doc<"cases">["_id"] | null = args.caseId ?? null;

		if (args.pageContext === "investigation" && (args.caseId || args.alertId)) {
			const caseData = args.caseId
				? await ctx.runQuery(internal.cases.getCaseContextById, {
						caseId: args.caseId,
					})
				: args.alertId
					? await ctx.runQuery(internal.cases.gatherInvestigationData, {
							alertId: args.alertId,
						})
					: null;

			if (!caseIdForRag && args.alertId) {
				caseIdForRag = await ctx.runQuery(internal.cases.getCaseIdByAlertId, {
					alertId: args.alertId,
				});
			}

			if (caseData?.user && caseData.alert) {
				const transactions = Array.isArray(caseData.transactions)
					? (caseData.transactions as EvidenceTransaction[])
					: [];
				const evidenceLines = transactions
					.slice(0, 12)
					.map((tx) => formatTransaction(tx))
					.join("\n");
				const evidenceBlock = evidenceLines
					? `\n\nEVIDENCE TRANSACTIONS (up to 12):\n- ${evidenceLines.replace(/\n/g, "\n- ")}`
					: "\n\nEVIDENCE TRANSACTIONS: None found.";
				const geoSummary =
					caseData.alert.trigger === "Geographic Anomaly"
						? summarizeGeographicAnomaly(transactions)
						: null;

				systemPrompt = `
                ROLE: CasePilot Investigator.
                            
                TONE: Professional, Concise, Action-Oriented.
                            
                FORMATTING RULES:
                1. Use **Markdown** for emphasis (Bold key figures, locations, and risk scores).
                2. Use Bullet Points for lists of transactions.
                3. Convert ISO dates into "Relative Time" (e.g., "2 hours ago", "Yesterday").
                4. Use Emoji indicators for transaction direction (⬇️ Deposit, ⬆️ Withdrawal/Transfer).
                5. Do NOT dump raw JSON. Synthesize the story.
                            
                CONTEXT ANALYSIS:
                If the trigger is "Geographic Anomaly", explicitly point out the distance/time difference between locations.
                            
                CURRENT CASE CONTEXT:
                Suspect: ${caseData.user.name}
                Risk Score: ${caseData.alert.riskScore}
                Trigger: ${caseData.alert.trigger}
                Account Status: ${caseData.user.status}
                Evidence Count: ${transactions.length}
                	${geoSummary ? `Geo Summary: ${geoSummary}` : ""}
                ${evidenceBlock}
                            
                RULES:
                - Use ONLY the evidence provided in this prompt. Do not invent transactions.
                - If the answer is not in the evidence, say you do not have enough data.
                - When asked about a transaction, cite the exact evidence line.
                `;
			} else {
				systemPrompt +=
					"\n\nMODE: INVESTIGATION\nFocus on the current case context.";
			}
		} else {
			systemPrompt +=
				"\n\nMODE: DASHBOARD / TRIAGE\nAssist with filtering alerts and explaining compliance policies at a high level.";
		}

		const incomingMessages = Array.isArray(args.messages) ? args.messages : [];
		const modelMessages: ModelMessage[] = incomingMessages
			.map((message) => {
				const role = message?.role;
				if (role !== "user" && role !== "assistant" && role !== "system") {
					return null;
				}
				const content = getMessageText(message).trim();
				if (!content) return null;
				return { role, content };
			})
			.filter((message): message is ModelMessage => Boolean(message));

		const lastUserMessage = [...modelMessages]
			.reverse()
			.find((message) => message.role === "user")?.content;

		let retrievedSection: string | null = null;
		let retrievedSources: SourceSection[] = [];
		if (lastUserMessage) {
			try {
				const embeddingResult = await embed({
					model: embeddingModel,
					value: lastUserMessage,
				});
				const vectorResults = await ctx.vectorSearch(
					"evidence",
					"by_embedding",
					{
						vector: embeddingResult.embedding,
						limit: 8,
					},
				);
				const evidenceIds = vectorResults.map((result) => result._id);
				const evidenceDocsRaw = evidenceIds.length
					? await ctx.runQuery(internal.evidence.fetchEvidenceByIds, {
							ids: evidenceIds,
						})
					: [];
				const evidenceDocs = evidenceDocsRaw.filter(
					Boolean,
				) as RetrievedEvidence[];

				const orderedEvidence = vectorResults
					.map((result) => evidenceDocs.find((doc) => doc._id === result._id))
					.filter((doc): doc is RetrievedEvidence => Boolean(doc));

				const currentEvidence = orderedEvidence
					.filter((doc) => caseIdForRag && doc.caseId === caseIdForRag)
					.slice(0, 3);
				const similarEvidence = orderedEvidence
					.filter((doc) => doc.caseId && doc.caseId !== caseIdForRag)
					.slice(0, 3);

				const similarCaseIds = Array.from(
					new Set(similarEvidence.map((doc) => doc.caseId).filter(Boolean)),
				) as Doc<"cases">["_id"][];
				const similarCases = similarCaseIds.length
					? await ctx.runQuery(internal.cases.getCasesByIds, {
							ids: similarCaseIds,
						})
					: [];
				const caseMap = new Map(similarCases.map((doc) => [doc._id, doc]));

				const evidenceSections = buildEvidenceSections(
					currentEvidence,
					similarEvidence,
					caseMap,
				);
				retrievedSection = evidenceSections.promptSection;
				retrievedSources = evidenceSections.sources;

				if (retrievedSection) {
					systemPrompt += `\n\nRETRIEVED EVIDENCE:\n${retrievedSection}`;
				}
			} catch (error) {
				console.error("RAG retrieval failed", error);
			}
		}

		const { text } = await generateText({
			model: mainModel,
			messages: [{ role: "system", content: systemPrompt }, ...modelMessages],
		});

		const lastUser = [...modelMessages]
			.reverse()
			.find(
				(message) =>
					message.role === "user" && typeof message.content === "string",
			);
		const uiComponent = lastUser?.content
			? detectUiComponent(lastUser.content)
			: undefined;

		return {
			content: text,
			uiComponent,
			sources: retrievedSources.length ? retrievedSources : undefined,
		};
	},
});
