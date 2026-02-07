import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { formatDateTime } from "@/utils/date.util";

type Alert = Doc<"alerts"> & { username: string | null };

type StackedAlert = {
	id: string;
	label: string;
	score: number;
	count: number;
	latestTimestamp: number;
};

interface RiskOverviewPanelProps {
	totalAlerts: number;
	highRiskAlerts: number;
	linkedRings: number;
	alerts: Alert[];
}

function stackAlerts(alerts: Alert[]): StackedAlert[] {
	const grouped = new Map<Id<"users"> | string, StackedAlert>();

	for (const alert of alerts) {
		const groupKey = alert.userId ?? alert.username ?? alert._id;
		const existing = grouped.get(groupKey);
		const label = alert.username ?? "Unknown";

		if (!existing) {
			grouped.set(groupKey, {
				id: String(groupKey),
				label,
				score: alert.riskScore,
				count: 1,
				latestTimestamp: alert.createdAt,
			});
			continue;
		}

		grouped.set(groupKey, {
			...existing,
			score: Math.max(existing.score, alert.riskScore),
			count: existing.count + 1,
			latestTimestamp: Math.max(existing.latestTimestamp, alert.createdAt),
		});
	}

	return Array.from(grouped.values())
		.sort((a, b) => b.score - a.score || b.latestTimestamp - a.latestTimestamp)
		.slice(0, 5);
}

function getRiskPillClass(score: number) {
	if (score >= 90) return "text-destructive bg-destructive/10";
	if (score >= 80) return "text-orange-600 bg-orange-100";
	if (score >= 70) return "text-yellow-700 bg-yellow-100";
	return "text-muted-foreground bg-muted/40";
}

export default function RiskOverviewPanel({
	totalAlerts,
	highRiskAlerts,
	linkedRings,
	alerts,
}: RiskOverviewPanelProps) {
	const stackedAlerts = useMemo(() => stackAlerts(alerts), [alerts]);

	return (
		<div className="space-y-4">
			<div className="bg-card rounded border border-border p-6 shadow-sm">
				<div className="flex items-start justify-between">
					<div>
						<p className="text-sm text-muted-foreground mb-1">Total Alerts</p>
						<p className="text-3xl font-bold text-foreground">{totalAlerts}</p>
					</div>
					<div className="text-2xl">📊</div>
				</div>
				<p className="text-xs text-muted-foreground mt-3">
					Based on active alerts in the queue
				</p>
			</div>

			<div className="rounded border border-destructive/20 bg-destructive/5 p-6 shadow-sm">
				<div className="flex items-start justify-between">
					<div>
						<p className="text-sm text-muted-foreground mb-1">
							High Risk Active
						</p>
						<p className="text-3xl font-bold text-destructive">
							{highRiskAlerts}
						</p>
					</div>
					<div className="text-2xl">🚨</div>
				</div>
				<p className="text-xs text-destructive/70 mt-3">
					Requires immediate action
				</p>
			</div>

			<div className="rounded border border-primary/20 bg-primary/5 p-6 shadow-sm">
				<div className="flex items-start justify-between">
					<div>
						<p className="text-sm text-muted-foreground mb-1">
							Accounts Impacted
						</p>
						<p className="text-3xl font-bold text-primary">{linkedRings}</p>
					</div>
					<div className="text-2xl">🧾</div>
				</div>
				<p className="text-xs text-primary/70 mt-3">
					Unique accounts with active alerts
				</p>
			</div>

			<div className="bg-card rounded border border-border p-6 shadow-sm">
				<h3 className="font-semibold text-foreground mb-4">
					Top Risk Accounts
				</h3>
				{stackedAlerts.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No high-risk accounts yet
					</p>
				) : (
					<div className="space-y-3">
						{stackedAlerts.map((account) => (
							<div
								key={account.id}
								className="flex items-center justify-between p-3 rounded bg-muted/30"
							>
								<div>
									<div className="flex items-center gap-2">
										<span className="text-sm text-foreground">
											{account.label}
										</span>
										{account.count > 1 && (
											<Badge variant="outline">x{account.count}</Badge>
										)}
									</div>
									<p className="text-[11px] text-muted-foreground">
										Last seen: {formatDateTime(account.latestTimestamp)}
									</p>
								</div>
								<span
									className={`text-xs font-semibold px-2 py-1 rounded ${getRiskPillClass(
										account.score,
									)}`}
								>
									{account.score}%
								</span>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
