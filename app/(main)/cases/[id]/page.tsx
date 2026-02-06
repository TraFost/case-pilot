"use client";

import { use, type Usable } from "react";
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

	return (
		<div className="min-h-screen bg-background">
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
							<FraudRingNetwork />
						</div>

						{/* Transaction Timeline */}
						<div className="bg-card rounded border border-border p-6 shadow-sm">
							<h2 className="text-lg font-semibold text-foreground mb-4">
								Transaction Timeline
							</h2>
							<div className="space-y-3">
								{transactionTimeline.map((tx, idx) => (
									<div
										key={idx}
										className={`p-3 rounded border ${
											tx.highlight
												? "bg-destructive/10 border-destructive/30"
												: "bg-muted/30 border-border"
										}`}
									>
										<div className="flex items-start justify-between">
											<div>
												<p className="font-semibold text-foreground">
													{tx.time}
												</p>
												<p className="text-xs text-muted-foreground">
													{tx.type}
												</p>
											</div>
											<div className="text-right">
												<p className="font-semibold text-foreground">
													{tx.amount}
												</p>
												<p className="text-xs text-muted-foreground">
													{tx.note}
												</p>
											</div>
										</div>
									</div>
								))}
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
		</div>
	);
}
