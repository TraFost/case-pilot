import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { formatTimeLabel } from "@/utils/date.util";

type ChartDataPoint = {
	time: string;
	riskScore: number;
};

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
	const injectAttack = useMutation(api.alerts.injectAttack);
	const [attackBurstUntil, setAttackBurstUntil] = useState<number | null>(null);
	const burstTimeoutRef = useRef<number | null>(null);

	const highRiskAlerts = useMemo(
		() => alerts.filter((alert) => alert.riskScore >= 85) ?? [],
		[alerts],
	);

	const linkedRings = useMemo(
		() => new Set(alerts.map((alert) => alert.userId)).size,
		[alerts],
	);

	const chartData = useMemo(() => buildChartData(alerts), [alerts]);

	const isAttackMode =
		attackBurstUntil !== null && Date.now() < attackBurstUntil;

	useEffect(() => {
		return () => {
			if (burstTimeoutRef.current !== null) {
				window.clearTimeout(burstTimeoutRef.current);
			}
		};
	}, []);

	const onInjectAttack = useCallback(async () => {
		const result = await injectAttack({});
		if (result?.scheduled) {
			const burstWindowMs = 6000;
			const until = Date.now() + burstWindowMs;
			setAttackBurstUntil(until);
			if (burstTimeoutRef.current !== null) {
				window.clearTimeout(burstTimeoutRef.current);
			}
			burstTimeoutRef.current = window.setTimeout(() => {
				setAttackBurstUntil(null);
			}, burstWindowMs);
		}
	}, [injectAttack]);

	return {
		alerts,
		chartData,
		highRiskCount: highRiskAlerts.length,
		linkedRingsCount: linkedRings,
		isAttackMode,
		onInjectAttack,
	};
}
