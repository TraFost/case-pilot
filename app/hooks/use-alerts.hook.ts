import { useCallback, useMemo } from "react";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";

type ChartDataPoint = {
	time: string;
	riskScore: number;
};

type TopRiskAccount = {
	label: string;
	score: number;
};

function formatTimeLabel(timestamp: number) {
	const date = new Date(timestamp);
	const hours = `${date.getHours()}`.padStart(2, "0");
	const minutes = `${date.getMinutes()}`.padStart(2, "0");

	return `${hours}:${minutes}`;
}

function buildChartData(alerts: { createdAt: number; riskScore: number }[]) {
	const bucketMinutes = 5;
	const bucketCount = 6;
	const bucketMs = bucketMinutes * 60 * 1000;

	const now = Date.now();
	const points: ChartDataPoint[] = [];

	for (let i = bucketCount - 1; i >= 0; i -= 1) {
		const bucketStart = now - (i + 1) * bucketMs;
		const bucketEnd = now - i * bucketMs;
		const bucketAlerts = alerts.filter(
			(alert) => alert.createdAt >= bucketStart && alert.createdAt < bucketEnd,
		);
		const avgRiskScore = bucketAlerts.length
			? Math.round(
					bucketAlerts.reduce((sum, alert) => sum + alert.riskScore, 0) /
						bucketAlerts.length,
				)
			: 0;

		points.push({ time: formatTimeLabel(bucketEnd), riskScore: avgRiskScore });
	}

	return points;
}

export function useAlerts() {
	const alerts = useQuery(api.alerts.getAllTasks) ?? [];

	const highRiskAlerts = useMemo(
		() => alerts.filter((alert) => alert.riskScore >= 85) ?? [],
		[alerts],
	);

	const linkedRings = useMemo(
		() => new Set(alerts.map((alert) => alert.userId)).size,
		[alerts],
	);

	const topRiskAccounts = useMemo<TopRiskAccount[]>(() => {
		return [...alerts]
			.filter((alert) => alert.riskScore >= 80)
			.map((alert) => ({
				label: alert.username ?? "Unknown",
				score: alert.riskScore,
			}));
	}, [alerts]);

	const chartData = useMemo(() => buildChartData(alerts), [alerts]);

	const isAttackMode = useMemo(
		() =>
			highRiskAlerts.length >= 5 &&
			alerts.some((alert) => alert.riskScore >= 90),
		[alerts, highRiskAlerts.length],
	);

	const onInjectAttack = useCallback(() => {}, []);

	return {
		alerts,
		chartData,
		highRiskCount: highRiskAlerts.length,
		linkedRingsCount: linkedRings,
		topRiskAccounts,
		isAttackMode,
		onInjectAttack,
	};
}
