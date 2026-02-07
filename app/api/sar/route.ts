import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";

import { api } from "@/convex/_generated/api";

type SarResponse = {
	subjectName: string;
	subjectId: string;
	riskScore: number;
	trigger: string;
	reportDate: string;
	narrative: string;
};

export async function POST(request: Request) {
	const body = await request.json();
	const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

	if (!convexUrl) {
		return NextResponse.json(
			{ error: "Missing NEXT_PUBLIC_CONVEX_URL" },
			{ status: 500 },
		);
	}

	if (!body?.alertId) {
		return NextResponse.json({ error: "Missing alertId" }, { status: 400 });
	}

	const client = new ConvexHttpClient(convexUrl);
	const report = (await client.action(api.sar.generateSarReport, {
		alertId: body.alertId,
	})) as SarResponse;

	return NextResponse.json(report);
}
