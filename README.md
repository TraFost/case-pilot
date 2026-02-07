# CasePilot

CasePilot is a AML and fraud investigation console. It combines real-time alert triage, case investigation, AI-guided analysis with RAG sources, and SAR report generation with PDF export.

## What this app does

- Monitor live fraud alerts, risk trends, and ring activity
- Investigate cases with maps, charts, and evidence timelines
- Use the AI assistant for grounded analysis and sources
- Generate SAR narratives and export to PDF
- Track enforcement actions and audit trails

## Architecture at a glance

- Next.js App Router UI in app/
- Convex backend in convex/ (queries, mutations, actions, scheduler)
- AI via OpenRouter for chat + SAR narratives
- RAG sources pulled from evidence and surfaced in the chat UI

More detail: [docs/main-features.md](docs/main-features.md)

## Tech stack

- Next.js 16, React 19
- Convex 1.x
- Tailwind CSS v4 + tw-animate-css
- Zod, AI SDK, OpenRouter
- Recharts, ReactFlow, react-simple-maps

## Quick start

1. Install dependencies

```bash
pnpm install
```

2. Set environment variables

Create a .env.local file and include the public keys validated in [app/configs/env.config.ts](app/configs/env.config.ts):

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

## Seeding demo data

```bash
pnpm run server:seed
```

To clear and reseed:

```bash
pnpm run server:seed:clear
```

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
- docs/ — architecture snapshot

Key references:

- [app/layout.tsx](app/layout.tsx) wires the Convex provider + toaster
- [app/hooks/use-alerts.hook.ts](app/hooks/use-alerts.hook.ts) shows the hook → API pattern
- [convex/schema.ts](convex/schema.ts) defines the data model
- [app/utils/pdf.util.ts](app/utils/pdf.util.ts) builds SAR PDFs

## Convex workflow

Convex functions live in convex/. See [convex/README.md](convex/README.md) for CLI usage and function patterns.

## Deployment

Deploy to Vercel or your preferred platform. Ensure the same public env vars from [app/configs/env.config.ts](app/configs/env.config.ts) are configured in the deployment environment.
