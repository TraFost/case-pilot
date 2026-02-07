"use client";

import Header from "@/components/alerts/header";
import LiveAttackChart from "@/components/alerts/live-attack-chart";
import AlertsTable from "@/components/alerts/alerts-table";
import RiskOverviewPanel from "@/components/alerts/risk-overview-panel";
import { Skeleton } from "@/components/ui/skeleton";

import { useAlerts } from "@/hooks/use-alerts.hook";

export default function AlertsPage() {
	const {
		alerts,
		chartData,
		highRiskCount,
		linkedRingsCount,
		isAttackMode,
		onInjectAttack,
		isLoading,
	} = useAlerts();

	if (isLoading) {
		return (
			<div className="min-h-screen bg-background">
				<header className="border-b border-border bg-card">
					<div className="px-6 py-4 flex items-center justify-between">
						<div className="space-y-2">
							<Skeleton className="h-6 w-32" />
							<Skeleton className="h-4 w-48" />
						</div>
						<div className="flex items-center gap-4">
							<div className="space-y-2">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-3 w-16" />
							</div>
							<Skeleton className="h-10 w-10 rounded-full" />
						</div>
					</div>
				</header>

				<main className="px-6 py-8">
					<div className="mb-8 space-y-2">
						<Skeleton className="h-8 w-72" />
						<Skeleton className="h-4 w-96" />
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						<div className="lg:col-span-2 space-y-6">
							<div className="bg-card rounded border border-border p-6 shadow-sm space-y-4">
								<div className="flex items-center justify-between">
									<div className="space-y-2">
										<Skeleton className="h-5 w-40" />
										<Skeleton className="h-4 w-64" />
									</div>
									<Skeleton className="h-9 w-44" />
								</div>
								<Skeleton className="h-80 w-full" />
							</div>

							<div className="bg-card rounded border border-border p-6 shadow-sm space-y-4">
								<Skeleton className="h-5 w-40" />
								<Skeleton className="h-4 w-56" />
								<div className="space-y-3">
									<Skeleton className="h-8 w-full" />
									<Skeleton className="h-8 w-full" />
									<Skeleton className="h-8 w-full" />
									<Skeleton className="h-8 w-full" />
								</div>
							</div>
						</div>

						<div className="space-y-4">
							<div className="bg-card rounded border border-border p-6 shadow-sm space-y-3">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-8 w-20" />
								<Skeleton className="h-3 w-40" />
							</div>
							<div className="bg-card rounded border border-border p-6 shadow-sm space-y-3">
								<Skeleton className="h-4 w-28" />
								<Skeleton className="h-8 w-16" />
								<Skeleton className="h-3 w-32" />
							</div>
							<div className="bg-card rounded border border-border p-6 shadow-sm space-y-3">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-8 w-20" />
								<Skeleton className="h-3 w-36" />
							</div>
							<div className="bg-card rounded border border-border p-6 shadow-sm space-y-3">
								<Skeleton className="h-4 w-32" />
								<div className="space-y-2">
									<Skeleton className="h-8 w-full" />
									<Skeleton className="h-8 w-full" />
									<Skeleton className="h-8 w-full" />
								</div>
							</div>
						</div>
					</div>
				</main>
			</div>
		);
	}

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
							alerts={alerts}
						/>
					</div>
				</div>
			</main>
		</div>
	);
}
