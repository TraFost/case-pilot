import { z } from "zod";

const envSchema = z.object({
	NEXT_PUBLIC_CONVEX_URL: z.string().min(1),
	NEXT_PUBLIC_CONVEX_SITE_URL: z.string().min(1),
	NEXT_PUBLIC_OPENROUTER_API_KEY: z.string().min(1),
	NEXT_PUBLIC_OPENROUTER_EMBEDDING_MODEL: z.string().min(1),
	NEXT_PUBLIC_OPENROUTER_MAIN_MODEL: z.string().min(1),
	NEXT_PUBLIC_OPENROUTER_BACKUP_MODEL: z.string().min(1),
});

const parsedEnv = envSchema.safeParse({
	NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
	NEXT_PUBLIC_CONVEX_SITE_URL: process.env.NEXT_PUBLIC_CONVEX_SITE_URL,
	NEXT_PUBLIC_OPENROUTER_API_KEY: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY,
	NEXT_PUBLIC_OPENROUTER_EMBEDDING_MODEL:
		process.env.NEXT_PUBLIC_OPENROUTER_EMBEDDING_MODEL,
	NEXT_PUBLIC_OPENROUTER_MAIN_MODEL:
		process.env.NEXT_PUBLIC_OPENROUTER_MAIN_MODEL,
	NEXT_PUBLIC_OPENROUTER_BACKUP_MODEL:
		process.env.NEXT_PUBLIC_OPENROUTER_BACKUP_MODEL,
});

if (!parsedEnv.success) {
	console.error("Invalid environment variables:");
	parsedEnv.error.issues.forEach((issue) => {
		console.error(`- ${issue.path.join(".")}: ${issue.message}`);
	});
	throw new Error("Invalid environment variables");
}

export const env = parsedEnv.data;
