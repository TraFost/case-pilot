# Copilot instructions

## Big picture

- This is a Next.js App Router frontend with a Convex backend. UI lives under the app/ directory, while Convex schema/functions live in convex/.
- The root layout wires global providers: Convex client + Sonner toaster. See [app/layout.tsx](app/layout.tsx) and [app/providers/convex.provider.tsx](app/providers/convex.provider.tsx).
- Data flow is Convex-first: frontend hooks call generated APIs from convex/ functions (example hook: [app/hooks/tasks.hook.ts](app/hooks/tasks.hook.ts) -> query in [convex/tasks.ts](convex/tasks.ts)).
- Convex data model is defined in [convex/schema.ts](convex/schema.ts); tables include users, transactions, alerts, cases, actions, entities, links.

## Project-specific patterns

- Path aliases are configured in [tsconfig.json](tsconfig.json). Prefer imports like @/components/... and @/convex/\_generated/api.
- Env is validated at runtime with Zod in [app/configs/env.config.ts](app/configs/env.config.ts). Add new public env keys there first, or the app will throw on boot.
- AI integration uses OpenRouter via the AI SDK in [app/configs/ai.config.ts](app/configs/ai.config.ts) and model helpers in [app/lib/ai/ai-model.lib.ts](app/lib/ai/ai-model.lib.ts).
- UI components follow class-variance-authority + cn utility pattern (example: [app/components/ui/button.tsx](app/components/ui/button.tsx), [app/utils/classname.util.ts](app/utils/classname.util.ts)).
- Toasts use Sonner + lucide icons via [app/components/ui/sonner.tsx](app/components/ui/sonner.tsx).

## Workflows

- Dev server: pnpm dev (or npm/yarn/bun). See [package.json](package.json).
- Build/Start: pnpm build / pnpm start. See [package.json](package.json).
- Lint: pnpm lint. See [package.json](package.json).
- Convex functions live in convex/; consult [convex/README.md](convex/README.md) for CLI usage and function patterns.

## How to extend safely

- When adding Convex queries/mutations, define them in convex/ and consume via the generated api in app/ (see [app/hooks/tasks.hook.ts](app/hooks/tasks.hook.ts)).
- When adding UI primitives, keep variants via cva and merge classes using cn (see [app/components/ui/button.tsx](app/components/ui/button.tsx)).
- Keep environment variables in sync with [app/configs/env.config.ts](app/configs/env.config.ts) to avoid runtime errors.
