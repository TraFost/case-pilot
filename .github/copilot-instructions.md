# Copilot instructions

## Big picture

- This is a Next.js App Router frontend with a Convex backend. UI lives under the app/ directory, while Convex schema/functions live in convex/.
- The root layout wires global providers: Convex client + Sonner toaster. See app/layout.tsx and app/providers/convex.provider.tsx.
- Data flow is Convex-first: frontend hooks call generated APIs from convex/ functions (example hook: app/hooks/use-alerts.hook.ts -> query in convex/alerts.ts).
- Convex data model is defined in convex/schema.ts; tables include users, transactions, alerts, cases, actions, entities, links, messages, evidence.

## Convex relationship rules (critical)

- Convex does not support SQL-style joins. All relations are resolved manually.
- Store references using `v.id("table")`. Never duplicate user names or denormalize relational data unless explicitly needed for performance.
- Always resolve relations inside Convex query functions, never in the React client.
- For list views like alerts, prefer returning a minimal derived field (e.g., `username`) instead of embedding full related documents unless the UI needs them.

### One-to-one / many-to-one

Use `getAll` from `convex-helpers/server/relationships` to batch load referenced docs.

Pattern:

```ts
import { getAll } from "convex-helpers/server/relationships";

const rows = await ctx.db.query("alerts").collect();
const users = await getAll(
	ctx.db,
	rows.map((r) => r.userId),
);

const map = new Map(users.filter(Boolean).map((u) => [u!._id, u]));

return rows.map((r) => ({
	...r,
	user: map.get(r.userId) ?? null,
}));
```

Never call `ctx.db.get()` inside a loop.

### One-to-many

Use indexes + `getManyFrom`.

Example:

```ts
import { getManyFrom } from "convex-helpers/server/relationships";

const alerts = await ctx.db.query("alerts").collect();

const alertsWithCases = await Promise.all(
	alerts.map(async (alert) => ({
		...alert,
		cases: await getManyFrom(ctx.db, "cases", "by_alert", alert._id),
	})),
);
```

### Many-to-many

Use link tables + `getManyVia`.

Example:

```ts
import { getManyVia } from "convex-helpers/server/relationships";

const entities = await getManyVia(
	ctx.db,
	"links",
	"by_user",
	userId,
	"entityId",
);
```

### Performance rules

- Batch all relationship fetches.
- Never perform N+1 `ctx.db.get()` calls.
- Prefer indexes over full table scans.
- Resolve relations once inside the query and return fully hydrated objects to the frontend.
- Keep Convex queries deterministic and side-effect free.

## Project-specific patterns

- Path aliases are configured in tsconfig.json. Prefer imports like @/components/... and @/convex/\_generated/api.
- Env is validated at runtime with Zod in app/configs/env.config.ts. Add new public env keys there first or the app will throw on boot. Current keys include `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CONVEX_SITE_URL`, and the OpenRouter model keys.
- AI integration uses OpenRouter via the AI SDK in app/configs/ai.config.ts and model helpers in app/lib/ai/ai-model.lib.ts.
- UI components follow class-variance-authority + cn utility pattern (example: app/components/ui/button.tsx, app/utils/classname.util.ts).
- Toasts use Sonner + lucide icons via app/components/ui/sonner.tsx.

## Workflows

- Dev server: pnpm dev (or npm/yarn/bun). See package.json.
- Build/Start: pnpm build / pnpm start. See package.json.
- Lint: pnpm lint. See package.json.
- Convex functions live in convex/; consult convex/README.md for CLI usage and function patterns.

## How to extend safely

- When adding Convex queries/mutations, define them in convex/ and consume via the generated api in app/.
- Always resolve relations inside Convex functions before returning data.
- Never fetch related documents directly from the client.
- When adding UI primitives, keep variants via cva and merge classes using cn.
- Keep environment variables in sync with app/configs/env.config.ts to avoid runtime errors.
