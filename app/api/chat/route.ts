import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";
import {
	createUIMessageStream,
	createUIMessageStreamResponse,
	type UIMessage,
} from "ai";

import { api } from "@/convex/_generated/api";

export async function POST(request: Request) {
	const body = await request.json();
	const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

	if (!convexUrl) {
		return NextResponse.json(
			{ error: "Missing NEXT_PUBLIC_CONVEX_URL" },
			{ status: 500 },
		);
	}

	const client = new ConvexHttpClient(convexUrl);
	const result = await client.action(api.chat.sendMessage, {
		messages: body?.messages ?? [],
		caseId: body?.caseId,
		alertId: body?.alertId,
		pageContext: body?.pageContext ?? "dashboard",
	});

	const uiTag = result.uiComponent ? `\n\n[[UI:${result.uiComponent}]]` : "";
	const originalMessages = Array.isArray(body?.messages)
		? (body.messages as UIMessage[])
		: [];
	const stream = createUIMessageStream<UIMessage>({
		originalMessages,
		execute: ({ writer }) => {
			writer.write({ type: "start" });
			writer.write({ type: "text-start", id: "text-0" });
			writer.write({
				type: "text-delta",
				id: "text-0",
				delta: `${result.content}${uiTag}`,
			});
			writer.write({ type: "text-end", id: "text-0" });
			if (result.sources?.length) {
				writer.write({
					type: "data-sources",
					data: result.sources,
				});
			}
			writer.write({ type: "finish" });
		},
	});

	return createUIMessageStreamResponse({ stream });
}
