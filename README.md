# CasePilot Next.js + Convex Boilerplate

Opinionated starter with Next.js App Router, Convex, and an AI-ready stack.

## Features

- Next.js App Router UI under app/
- Convex schema + functions under convex/
- Typed client APIs via generated Convex bindings
- Zod-validated public env variables
- OpenRouter AI SDK helpers (analysis + embeddings)
- Component variants with class-variance-authority + Tailwind merge
- Toasts wired with Sonner + lucide icons

## Tech stack

- Next.js 16, React 19
- Convex 1.x
- Tailwind CSS v4 + tw-animate-css
- Zod, AI SDK, OpenRouter

## Quick start

1. Install dependencies

```bash
pnpm install
```

2. Set environment variables

Create a .env.local file and include the public keys validated in
[app/configs/env.config.ts](app/configs/env.config.ts):

```bash
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CONVEX_SITE_URL=
NEXT_PUBLIC_OPENROUTER_API_KEY=
NEXT_PUBLIC_OPENROUTER_EMBEDDING_MODEL=
NEXT_PUBLIC_OPENROUTER_ANALYZE_MODEL=
```

3. Run the app

```bash
pnpm dev
```

Open http://localhost:3000

## Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
```

## Project structure

- app/ — App Router pages, UI components, hooks, providers
- convex/ — schema + query/mutation functions
- public/ — static assets

Key references:

- [app/layout.tsx](app/layout.tsx) wires the Convex provider + toaster
- [app/hooks/tasks.hook.ts](app/hooks/tasks.hook.ts) shows the hook → api pattern
- [convex/schema.ts](convex/schema.ts) defines the data model
- [app/components/ui/button.tsx](app/components/ui/button.tsx) shows CVA usage

## Convex workflow

Convex functions live in convex/. See [convex/README.md](convex/README.md)
for CLI usage and function patterns.

## Deployment

Use your preferred platform (Vercel recommended for Next.js). Ensure the
same public env vars from [app/configs/env.config.ts](app/configs/env.config.ts)
are configured in the deployment environment.
