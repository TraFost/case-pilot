type TopRiskAccount = {
	label: string;
	score: number;
};

interface RiskOverviewPanelProps {
	totalAlerts: number;
	highRiskAlerts: number;
	linkedRings: number;
	topRiskAccounts: TopRiskAccount[];
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
	topRiskAccounts,
}: RiskOverviewPanelProps) {
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

			<div className="bg-card rounded border border-border p-6 shadow-sm border-destructive/20 bg-destructive/5">
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

			<div className="bg-card rounded border border-border p-6 shadow-sm border-primary/20 bg-primary/5">
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
				{topRiskAccounts.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No high-risk accounts yet
					</p>
				) : (
					<div className="space-y-3">
						{topRiskAccounts.map((account) => (
							<div
								key={`${account.label}-${account.score}`}
								className="flex items-center justify-between p-3 rounded bg-muted/30"
							>
								<span className="text-sm text-foreground">{account.label}</span>
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
