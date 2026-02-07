"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
	ReactFlow,
	Background,
	Controls,
	type Node,
	type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Button } from "@/components/ui/button";
import LiveAttackChart from "@/components/alerts/live-attack-chart";
import AlertsTable from "@/components/alerts/alerts-table";
import RiskOverviewPanel from "@/components/alerts/risk-overview-panel";
import SuspiciousTransactionChart from "@/components/cases/suspicious-transaction-chart";
import ImpossibleTravelMap from "@/components/cases/impossible-travel-map";
import CaseReport from "@/components/cases/case-report";
import EnforcementActions from "@/components/cases/enforcement-actions";
import AuditTrail from "@/components/cases/audit-trail";
import SimilarCasesCard, {
	type SimilarCaseResult,
} from "@/components/cases/similar-cases-card";
import type { Doc, Id } from "@/convex/_generated/dataModel";

type Alert = Doc<"alerts"> & { username: string | null };

type Transaction = {
	amount: number;
	currency?: string | null;
	timestamp: number;
	isFraud: boolean;
	fraudTag?: string | null;
	meta?: {
		location?: {
			country?: string;
		};
	};
};

const now = Date.now();
const mockAlerts: Alert[] = [
	{
		_id: "alert_demo_1" as Id<"alerts">,
		_creationTime: now - 120000,
		userId: "user_demo_1" as Id<"users">,
		trigger: "Geographic Anomaly",
		riskScore: 92,
		amount: 92500,
		status: "Investigating",
		createdAt: now - 120000,
		evidenceTxIds: ["tx_demo_1" as Id<"transactions">],
		username: "Isa Chavez",
	},
	{
		_id: "alert_demo_2" as Id<"alerts">,
		_creationTime: now - 420000,
		userId: "user_demo_2" as Id<"users">,
		trigger: "Structuring Pattern",
		riskScore: 86,
		amount: 18000,
		status: "New",
		createdAt: now - 420000,
		evidenceTxIds: ["tx_demo_2" as Id<"transactions">],
		username: "Catherine Diaz",
	},
	{
		_id: "alert_demo_3" as Id<"alerts">,
		_creationTime: now - 720000,
		userId: "user_demo_3" as Id<"users">,
		trigger: "Rapid Withdrawal",
		riskScore: 79,
		amount: 64000,
		status: "Investigating",
		createdAt: now - 720000,
		evidenceTxIds: ["tx_demo_3" as Id<"transactions">],
		username: "Mina Duro",
	},
];

const mockChartData = [
	{ time: "09:00", riskScore: 18 },
	{ time: "09:05", riskScore: 24 },
	{ time: "09:10", riskScore: 22 },
	{ time: "09:15", riskScore: 31 },
	{ time: "09:20", riskScore: 28 },
	{ time: "09:25", riskScore: 40 },
];

const baseCaseTransactions: Transaction[] = [
	{
		amount: 19464.65,
		currency: "ETH",
		timestamp: now - 1000 * 60 * 60 * 12,
		isFraud: true,
		fraudTag: "Geographic",
		meta: { location: { country: "Norway" } },
	},
	{
		amount: 9738.65,
		currency: "ETH",
		timestamp: now - 1000 * 60 * 60 * 9,
		isFraud: true,
		fraudTag: "Geographic",
		meta: { location: { country: "Bolivia" } },
	},
	{
		amount: 10930.15,
		currency: "ETH",
		timestamp: now - 1000 * 60 * 60 * 5,
		isFraud: true,
		fraudTag: "Geographic",
		meta: { location: { country: "Turks and Caicos" } },
	},
	{
		amount: 1450,
		currency: "USD",
		timestamp: now - 1000 * 60 * 60 * 4,
		isFraud: false,
		meta: { location: { country: "United States" } },
	},
];

const mockTimeline = [
	{
		time: new Date(now - 1000 * 60 * 60 * 12).toISOString(),
		event: "Login from Norway",
	},
	{
		time: new Date(now - 1000 * 60 * 60 * 9).toISOString(),
		event: "Transfer to Bolivia",
	},
	{
		time: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
		event: "Deposit from Turks and Caicos",
	},
];

const mockAuditLogs = [
	{
		timestamp: "2026-02-07 09:12 UTC",
		action: "Case Opened",
		actor: "Analyst",
		justification: "Auto-escalated due to geographic anomaly.",
	},
	{
		timestamp: "2026-02-07 09:20 UTC",
		action: "Ring Mapped",
		actor: "System",
		justification: "Linked IP and wallet correlations identified.",
	},
];

const mockSimilarCases: SimilarCaseResult[] = [
	{
		caseId: "case_demo_01",
		caseSummary: "Geographic anomaly across 3 jurisdictions",
		caseStatus: "Closed",
		userName: "Aisha Abdullahi",
		outcome: "RESOLVE",
		outcomeNotes: "False positive cleared after verification.",
		similarity: 92,
		evidenceText: "Impossible travel velocity within 10 hours.",
	},
];

const ringNodes: Node[] = [
	{ id: "suspect", position: { x: 220, y: 40 }, data: { label: "Primary" } },
	{ id: "ip", position: { x: 80, y: 140 }, data: { label: "Shared IP" } },
	{
		id: "wallet",
		position: { x: 220, y: 140 },
		data: { label: "Shared Wallet" },
	},
	{
		id: "device",
		position: { x: 360, y: 140 },
		data: { label: "Shared Device" },
	},
	{ id: "mule1", position: { x: 40, y: 250 }, data: { label: "Mule A" } },
	{ id: "mule2", position: { x: 160, y: 260 }, data: { label: "Mule B" } },
	{ id: "mule3", position: { x: 280, y: 260 }, data: { label: "Mule C" } },
	{ id: "mule4", position: { x: 400, y: 250 }, data: { label: "Mule D" } },
].map((node) => ({
	...node,
	style: {
		padding: "8px 10px",
		borderRadius: "999px",
		border: "1px solid hsl(var(--border))",
		background: "hsl(var(--card))",
		fontSize: "11px",
		fontWeight: 600,
		color: "hsl(var(--foreground))",
		boxShadow: "0 6px 12px rgba(15, 23, 42, 0.08)",
	},
}));

const ringEdges: Edge[] = [
	{ id: "e1", source: "suspect", target: "ip" },
	{ id: "e2", source: "suspect", target: "wallet" },
	{ id: "e3", source: "suspect", target: "device" },
	{ id: "e4", source: "ip", target: "mule1" },
	{ id: "e5", source: "wallet", target: "mule2" },
	{ id: "e6", source: "device", target: "mule3" },
	{ id: "e7", source: "wallet", target: "mule4" },
].map((edge) => ({
	...edge,
	style: {
		stroke: "hsl(var(--destructive))",
		strokeWidth: 1.2,
		opacity: 0.7,
	},
}));

export default function Home() {
	const [attackMode, setAttackMode] = useState(false);

	useEffect(() => {
		if (!attackMode) return undefined;
		const timer = window.setTimeout(() => setAttackMode(false), 4500);
		return () => window.clearTimeout(timer);
	}, [attackMode]);

	const chartData = useMemo(() => {
		if (!attackMode) return mockChartData;
		return mockChartData.map((point, index) =>
			index === mockChartData.length - 1 ? { ...point, riskScore: 96 } : point,
		);
	}, [attackMode]);

	return (
		<main className="min-h-screen bg-background text-foreground">
			<header className="border-b border-border bg-background">
				<div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
					<div className="flex items-center gap-3">
						<div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
							CP
						</div>
						<div>
							<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
								CasePilot
							</p>
							<p className="text-sm font-semibold text-foreground">
								AML + Fraud Investigation
							</p>
						</div>
					</div>
					<nav className="hidden items-center gap-6 text-xs font-semibold text-muted-foreground md:flex">
						<Link href="#alerts" className="hover:text-foreground">
							Alerts
						</Link>
						<Link href="#cases" className="hover:text-foreground">
							Cases
						</Link>
						<Link href="#reports" className="hover:text-foreground">
							Reports
						</Link>
					</nav>
					<Button asChild size="sm">
						<Link href="/alerts">Run Demo</Link>
					</Button>
				</div>
			</header>

			<section className="mx-auto max-w-6xl px-6 pb-12 pt-12">
				<div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
					<div>
						<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
							Investigator Console
						</p>
						<h1 className="mt-4 text-4xl font-serif font-semibold leading-tight text-foreground sm:text-5xl">
							Fraud response across alerts, cases, and SARs in one view.
						</h1>
						<p className="mt-4 text-base text-muted-foreground">
							This landing page mirrors the modules already implemented inside
							CasePilot today, using static snapshots of the same UI components.
						</p>
						<div className="mt-6 flex flex-wrap gap-3">
							<Button asChild size="lg">
								<Link href="/alerts">View Alerts</Link>
							</Button>
						</div>
						<div className="mt-8 flex flex-wrap gap-2 text-xs text-muted-foreground">
							<span className="rounded-full border border-border px-3 py-1">
								AI Chatbot Investigator
							</span>
							<span className="rounded-full border border-border px-3 py-1">
								Audit Logs
							</span>
							<span className="rounded-full border border-border px-3 py-1">
								SAR (Suspicious Activity Report)
							</span>
							<span className="rounded-full border border-border px-3 py-1">
								Investigator Workflow
							</span>
							<span className="rounded-full border border-border px-3 py-1">
								Real-Time Alerts
							</span>
						</div>
					</div>
					<div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
						<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
							SAR Studio
						</p>
						<h2 className="mt-3 text-lg font-semibold text-foreground">
							Narrative reports generated from evidence trails.
						</h2>
						<div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
							<p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
								Confidential SAR
							</p>
							<p className="mt-3 text-sm text-foreground">
								Geographic anomaly confirmed across three jurisdictions within
								14 hours. Enforcement action recommended.
							</p>
							<p className="mt-3 text-xs text-muted-foreground">
								PDF export ready • Audit log attached
							</p>
						</div>
					</div>
				</div>
			</section>

			<section id="alerts" className="mx-auto max-w-6xl px-6 pb-16">
				<div className="mb-6">
					<p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
						Alerts Command Center
					</p>
					<h2 className="mt-3 text-2xl font-serif font-semibold text-foreground">
						Realtime Attack Operations
					</h2>
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2 space-y-6">
						<LiveAttackChart
							data={chartData}
							isAttackMode={attackMode}
							onInjectAttack={() => setAttackMode(true)}
						/>
						<AlertsTable alerts={mockAlerts} />
					</div>
					<RiskOverviewPanel
						totalAlerts={mockAlerts.length}
						highRiskAlerts={
							mockAlerts.filter((alert) => alert.riskScore >= 85).length
						}
						linkedRings={new Set(mockAlerts.map((alert) => alert.userId)).size}
						alerts={mockAlerts}
					/>
				</div>
			</section>

			<section id="cases" className="mx-auto max-w-6xl px-6 pb-16">
				<div className="mb-6">
					<p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
						Case Investigation Workspace
					</p>
					<h2 className="mt-3 text-2xl font-serif font-semibold text-foreground">
						Evidence, networks, and enforcement in one place.
					</h2>
				</div>
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					<div className="space-y-6 lg:col-span-2">
						<SimilarCasesCard results={mockSimilarCases} isLoading={false} />
						<ImpossibleTravelMap transactions={baseCaseTransactions} />
						<div className="bg-card rounded border border-border p-6 shadow-sm">
							<h3 className="text-lg font-semibold text-foreground mb-2">
								Suspicious Transaction Patterns
							</h3>
							<p className="text-sm text-muted-foreground mb-6">
								Transactions flagged from evidence signals
							</p>
							<SuspiciousTransactionChart transactions={baseCaseTransactions} />
						</div>
						<div className="bg-card rounded border border-border p-6 shadow-sm">
							<h3 className="text-lg font-semibold text-foreground mb-2">
								Fraud Ring Network
							</h3>
							<p className="text-sm text-muted-foreground mb-4">
								Spider web preview of linked entities
							</p>
							<div className="h-52 rounded-xl border border-border bg-background">
								<ReactFlow
									nodes={ringNodes}
									edges={ringEdges}
									fitView
									nodesDraggable={false}
									nodesConnectable={false}
									elementsSelectable={false}
									proOptions={{ hideAttribution: true }}
								>
									<Background color="hsl(var(--border))" gap={16} size={1} />
									<Controls showInteractive={false} />
								</ReactFlow>
							</div>
						</div>
					</div>
					<div className="space-y-6">
						<CaseReport
							summary="Account shows impossible travel velocity across three jurisdictions within 14 hours, indicating potential account takeover."
							confidence={0.86}
							recommendedAction="Freeze"
							topSignals={[
								"Trigger: Geographic Anomaly",
								"Risk score: 92",
								"3 suspicious ETH transfers",
							]}
							timeline={mockTimeline}
						/>
						<EnforcementActions
							onAction={async () => Promise.resolve()}
							alertStatus="Investigating"
							userStatus="Active"
						/>
						<AuditTrail logs={mockAuditLogs} />
					</div>
				</div>
			</section>

			<section id="reports" className="mx-auto max-w-6xl px-6 pb-20">
				<div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
					<div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
						<div>
							<p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
								Reports and Audit
							</p>
							<h2 className="mt-3 text-2xl font-serif font-semibold text-foreground">
								Stop investigating fraud after it wins.
							</h2>
						</div>
						<div className="flex flex-wrap gap-3" id="request">
							<Button asChild>
								<Link href="/alerts">Run Demo</Link>
							</Button>
						</div>
					</div>
					<div className="mt-8 flex flex-wrap gap-6 text-xs text-muted-foreground">
						<Link href="#privacy" className="hover:text-foreground">
							Privacy
						</Link>
						<Link href="#compliance" className="hover:text-foreground">
							Compliance
						</Link>
						<Link href="#docs" className="hover:text-foreground">
							Docs
						</Link>
					</div>
				</div>
			</section>
		</main>
	);
}
