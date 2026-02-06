"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import SuspiciousTransactionChart from "@/components/cases/suspicious-transaction-chart";
import FraudRingNetwork from "@/components/cases/fraud-ring-network";
import ImpossibleTravelMap from "@/components/cases/impossible-travel-map";
import CaseReport from "@/components/cases/case-report";
import EnforcementActions from "@/components/cases/enforcement-actions";
import AuditTrail from "@/components/cases/audit-trail";

import { useCaseDetail } from "@/hooks/use-case-detail.hook";
import { formatDateTime } from "@/utils/date.util";

export default function CaseDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);

	const {
		caseData,
		isLoading,
		auditLogs,
		transactionTimeline,
		reportTimeline,
		topSignals,
		handleEnforcementAction,
	} = useCaseDetail(id);

	if (isLoading) {
		return (
			<div className="min-h-screen bg-background">
				<main className="px-6 py-8">
					<p className="text-sm text-muted-foreground">Loading case...</p>
				</main>
			</div>
		);
	}

	if (!caseData) {
		return (
			<div className="min-h-screen bg-background">
				<main className="px-6 py-8">
					<p className="text-sm text-muted-foreground">Case not found.</p>
				</main>
			</div>
		);
	}

	const caseTitle = caseData.case
		? `Case #${caseData.case._id}`
		: `Alert #${caseData.alert._id}`;
	const caseSubtitle = caseData.alert.trigger;
	const riskScore = caseData.alert.riskScore;
	const summary = caseData.case?.summary ?? "";
	const confidence = caseData.case?.confidence ?? 0;
	const recommendedAction = caseData.case?.recommendedAction ?? "";
	const evidenceCount = caseData.alert.evidenceTxIds.length;
	const fraudTags = Array.from(
		new Set(
			caseData.transactions
				.map((tx) => tx.fraudTag)
				.filter((tag): tag is string => Boolean(tag)),
		),
	);
	const currencies = Array.from(
		new Set(caseData.transactions.map((tx) => tx.currency)),
	);
	const devices = Array.from(
		new Set(
			caseData.transactions
				.map((tx) => tx.meta?.device)
				.filter((device): device is string => Boolean(device)),
		),
	);
	const locations = Array.from(
		new Set(
			caseData.transactions
				.map((tx) => tx.meta?.location)
				.filter((location): location is string => Boolean(location)),
		),
	);

	return (
		<main className="min-h-screen bg-background">
			{/* Header */}
			<header className="border-b border-border bg-card">
				<div className="px-6 py-4">
					<Link href="/alerts">
						<Button variant="ghost" className="mb-4 -ml-2">
							<ArrowLeft className="w-4 h-4 mr-2" />
							Back to Alerts
						</Button>
					</Link>
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-serif font-bold text-foreground">
								{caseTitle}
							</h1>
							<p className="text-sm text-muted-foreground">{caseSubtitle}</p>
						</div>
						<div className="text-right">
							<div className="inline-block bg-destructive/15 border border-destructive/30 rounded px-4 py-2">
								<p className="text-xs text-muted-foreground">Risk Score</p>
								<p className="text-2xl font-bold text-destructive">
									{riskScore}
								</p>
							</div>
						</div>
					</div>
				</div>
			</header>

			<main className="px-6 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Left: Evidence & Charts */}
					<div className="lg:col-span-2 space-y-6">
						{/* Suspicious Transaction Patterns */}
						<div className="bg-card rounded border border-border p-6 shadow-sm">
							<h2 className="text-lg font-semibold text-foreground mb-2">
								Suspicious Transaction Patterns
							</h2>
							<p className="text-sm text-muted-foreground mb-6">
								Transactions flagged from alert evidence
							</p>
							<SuspiciousTransactionChart
								transactions={caseData.transactions}
							/>
						</div>

						{/* Fraud Ring Network */}
						<div className="bg-card rounded border border-border p-6 shadow-sm">
							<h2 className="text-lg font-semibold text-foreground mb-2">
								Fraud Ring Network
							</h2>
							<p className="text-sm text-muted-foreground mb-6">
								Visual representation of linked accounts and transactions
							</p>
							<FraudRingNetwork alertId={caseData.alert._id} />
						</div>

						{/* Account & Evidence Summary */}
						<div className="bg-card rounded border border-border p-6 shadow-sm">
							<div className="flex items-start justify-between mb-4">
								<h2 className="text-lg font-semibold text-foreground">
									Account & Evidence Summary
								</h2>
								<div className="text-xs text-muted-foreground">
									Last updated: {formatDateTime(caseData.alert.createdAt)}
								</div>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
								<div className="rounded border border-border bg-muted/20 p-4">
									<p className="text-xs text-muted-foreground">Account</p>
									<p className="font-semibold text-foreground">
										{caseData.user?.name ?? "Unknown"}
									</p>
									<p className="text-xs text-muted-foreground mt-2">
										Type: {caseData.user?.accountType ?? "N/A"}
									</p>
									<p className="text-xs text-muted-foreground">
										Status: {caseData.user?.status ?? "N/A"}
									</p>
									<p className="text-xs text-muted-foreground">
										Wallet: {caseData.user?.walletAddress ?? "N/A"}
									</p>
									<p className="text-xs text-muted-foreground">
										Last login IP: {caseData.user?.lastLoginIp ?? "N/A"}
									</p>
								</div>
								<div className="rounded border border-border bg-muted/20 p-4">
									<p className="text-xs text-muted-foreground">Alert</p>
									<p className="font-semibold text-foreground">
										{caseData.alert.trigger}
									</p>
									<p className="text-xs text-muted-foreground mt-2">
										Status: {caseData.alert.status}
									</p>
									<p className="text-xs text-muted-foreground">
										Evidence tx: {evidenceCount}
									</p>
									<p className="text-xs text-muted-foreground">
										Currencies: {currencies.join(", ") || "N/A"}
									</p>
									<p className="text-xs text-muted-foreground">
										Fraud tags: {fraudTags.join(", ") || "None"}
									</p>
								</div>
								<div className="rounded border border-border bg-muted/20 p-4">
									<p className="text-xs text-muted-foreground">Environment</p>
									<p className="font-semibold text-foreground">
										{caseData.user?.rawProfile?.country ?? "Unknown"}
									</p>
									<p className="text-xs text-muted-foreground mt-2">
										Primary device: {caseData.user?.rawProfile?.device ?? "N/A"}
									</p>
									<p className="text-xs text-muted-foreground">
										Observed devices: {devices.join(", ") || "N/A"}
									</p>
									<p className="text-xs text-muted-foreground">
										Locations: {locations.join(", ") || "N/A"}
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Right: Report & Actions */}
					<div className="space-y-6">
						<ImpossibleTravelMap />
						<CaseReport
							summary={summary}
							confidence={confidence}
							recommendedAction={recommendedAction}
							topSignals={topSignals}
							timeline={reportTimeline}
						/>
						<EnforcementActions onAction={handleEnforcementAction} />
						<AuditTrail logs={auditLogs} />
					</div>
				</div>
			</main>
		</main>
	);
}
