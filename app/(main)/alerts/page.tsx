"use client";

import Header from "@/components/alerts/header";
import LiveAttackChart from "@/components/alerts/live-attack-chart";
import AlertsTable from "@/components/alerts/alerts-table";
import RiskOverviewPanel from "@/components/alerts/risk-overview-panel";

import { useAlerts } from "@/hooks/use-alerts.hook";

export default function AlertsPage() {
	const {
		alerts,
		chartData,
		highRiskCount,
		linkedRingsCount,
		topRiskAccounts,
		isAttackMode,
		onInjectAttack,
	} = useAlerts();

	return (
		<div className="min-h-screen bg-background">
			<Header />

			<main className="px-6 py-8">
				<div className="mb-8">
					<h1 className="text-3xl font-serif font-bold text-foreground mb-2">
						Realtime Attack Operations
					</h1>
					<p className="text-muted-foreground">
						Monitor live fraud alerts and coordinate emergency response
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2 space-y-6">
						<LiveAttackChart
							data={chartData}
							isAttackMode={isAttackMode}
							onInjectAttack={onInjectAttack}
						/>
						<AlertsTable alerts={alerts} />
					</div>

					<div>
						<RiskOverviewPanel
							totalAlerts={alerts.length}
							highRiskAlerts={highRiskCount}
							linkedRings={linkedRingsCount}
							topRiskAccounts={topRiskAccounts}
						/>
					</div>
				</div>
			</main>
		</div>
	);
}
