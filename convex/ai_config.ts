"use node";

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOpenAI } from "@ai-sdk/openai";
import { config as loadEnv } from "dotenv";
import path from "path";

const envFiles = [".env.local"];

envFiles.forEach((envFile) => {
	loadEnv({ path: path.resolve(process.cwd(), envFile), override: false });
});

const apiKey =
	process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

if (!apiKey) {
	throw new Error(
		"MISSING API KEY: Please set OPENROUTER_API_KEY in Convex Dashboard.",
	);
}

const openRouter = createOpenRouter({
	apiKey: apiKey,
});

const openRouterAsOpenAI = createOpenAI({
	baseURL: "https://openrouter.ai/api/v1",
	apiKey: apiKey,
});

export const mainModel = openRouter("arcee-ai/trinity-large-preview:free", {});

export const embeddingModel = openRouterAsOpenAI.embedding("baai/bge-m3");
