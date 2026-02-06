import { Button } from "@/components/ui/button";

const features = [
	{
		title: "Next.js App Router",
		description:
			"File-based routing with server components and a modern layout system under app/.",
	},
	{
		title: "Convex backend",
		description:
			"Typed data layer with queries/mutations wired through generated APIs.",
	},
	{
		title: "Runtime env validation",
		description:
			"Zod-validated public env variables prevent boot-time surprises.",
	},
	{
		title: "AI-ready",
		description: "OpenRouter + AI SDK helpers for analysis and embeddings.",
	},
	{
		title: "Design system",
		description:
			"CVA + Tailwind merge pattern for consistent, variant-driven UI.",
	},
	{
		title: "Toasts built-in",
		description: "Sonner notifications prewired with lucide icons and theming.",
	},
];

const highlights = [
	"Typed schema with users, transactions, alerts, cases, actions, entities, links",
	"Hook pattern for data access (e.g., useTasks → api.tasks.get)",
	"Path aliases (@/components, @/convex, @/hooks, @/utils)",
	"Theme tokens mapped from globals.css via Tailwind theme",
];

export default function Home() {
	return (
		<main className="min-h-screen bg-background text-foreground">
			<section className="relative overflow-hidden border-b border-border">
				<div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 md:px-10 md:py-24">
					<div className="flex flex-col gap-5">
						<span className="w-fit rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
							Next.js + Convex starter
						</span>
						<h1 className="font-serif text-4xl leading-tight md:text-5xl">
							Ship investigations-grade fintech tooling faster.
						</h1>
						<p className="max-w-2xl text-base text-muted-foreground md:text-lg">
							This template bundles a Next.js App Router frontend with a typed
							Convex backend, AI-ready helpers, and a polished UI design.
						</p>
						<div className="flex flex-wrap gap-3">
							<Button>Explore features</Button>
							<Button variant="outline">View schema</Button>
						</div>
					</div>
					<div className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm md:grid-cols-2">
						{highlights.map((item) => (
							<div
								key={item}
								className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/60 p-4"
							>
								<span className="mt-1 size-2 rounded-full bg-primary" />
								<p className="text-sm text-foreground/90">{item}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="mx-auto w-full max-w-6xl px-6 py-16 md:px-10">
				<div className="flex flex-col gap-10">
					<div className="flex flex-col gap-3">
						<h2 className="text-2xl font-semibold">
							What this template includes
						</h2>
						<p className="max-w-2xl text-sm text-muted-foreground md:text-base">
							Everything you need to build a fraud detection cockpit: data
							modeling, real-time querying, and a theme system aligned to the
							supplied palette.
						</p>
					</div>
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{features.map((feature) => (
							<article
								key={feature.title}
								className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-xs"
							>
								<div className="flex items-center justify-between">
									<h3 className="text-lg font-semibold">{feature.title}</h3>
									<span className="h-2 w-10 rounded-full bg-secondary" />
								</div>
								<p className="text-sm text-muted-foreground">
									{feature.description}
								</p>
							</article>
						))}
					</div>
				</div>
			</section>

			<section className="border-y border-border bg-secondary/40">
				<div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 md:flex-row md:items-center md:justify-between md:px-10">
					<div className="flex flex-col gap-4">
						<h2 className="text-2xl font-semibold">Template workflow</h2>
						<p className="max-w-xl text-sm text-muted-foreground md:text-base">
							Define data in Convex, call it from hooks in app/, and ship
							polished UI with component variants and utility merges.
						</p>
					</div>
					<div className="grid gap-4 md:w-[420px]">
						<div className="rounded-xl border border-border bg-card p-4">
							<p className="text-sm font-medium">1. Model</p>
							<p className="text-xs text-muted-foreground">
								Update schema + indexes in Convex.
							</p>
						</div>
						<div className="rounded-xl border border-border bg-card p-4">
							<p className="text-sm font-medium">2. Query</p>
							<p className="text-xs text-muted-foreground">
								Use generated APIs in hooks.
							</p>
						</div>
						<div className="rounded-xl border border-border bg-card p-4">
							<p className="text-sm font-medium">3. Present</p>
							<p className="text-xs text-muted-foreground">
								Compose UI with CVA variants.
							</p>
						</div>
					</div>
				</div>
			</section>

			<section className="mx-auto w-full max-w-6xl px-6 py-16 md:px-10">
				<div className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-8 shadow-sm md:flex-row md:items-center md:justify-between">
					<div className="flex flex-col gap-3">
						<h2 className="text-2xl font-semibold">Ready to build?</h2>
						<p className="text-sm text-muted-foreground">
							Spin up the dev server and start composing the first case view.
						</p>
					</div>
					<div className="flex flex-wrap gap-3">
						<Button>Start with the UI kit</Button>
						<Button variant="secondary">Review Convex data</Button>
					</div>
				</div>
			</section>
		</main>
	);
}
