import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOpenAI } from "@ai-sdk/openai";

import { env } from "@/configs/env.config";

export const openRouter = createOpenRouter({
	apiKey: env.NEXT_PUBLIC_OPENROUTER_API_KEY,
});

export const openRouterAsOpenAI = createOpenAI({
	baseURL: "https://openrouter.ai/api/v1",
	apiKey: env.NEXT_PUBLIC_OPENROUTER_API_KEY,
});
