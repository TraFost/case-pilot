import {
	ScatterChart,
	Scatter,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import {
	formatDateTime,
	formatTimeLabel,
	toHourDecimal,
} from "@/utils/date.util";
import {
	formatCurrencyWithCode,
	normalizeCurrency,
	type Currency,
} from "@/utils/currency.util";

type Transaction = {
	amount: number;
	currency?: string | null;
	timestamp: number;
	isFraud: boolean;
	fraudTag?: string | null;
};

type ChartPoint = {
	time: number;
	timeLabel: string;
	timestamp: number;
	amount: number;
	currency: Currency;
	type: "suspicious" | "normal";
};

function formatHourDecimalLabel(value: number) {
	const hours = Math.floor(value);
	const minutes = Math.round((value - hours) * 60);
	const paddedHours = `${hours}`.padStart(2, "0");
	const paddedMinutes = `${minutes}`.padStart(2, "0");

	return `${paddedHours}:${paddedMinutes}`;
}

type CustomTooltipProps = {
	active?: boolean;
	payload?: Array<{ payload: ChartPoint }>;
};

function CustomTooltip({ active, payload }: CustomTooltipProps) {
	if (!active || !payload || payload.length === 0) return null;

	const point = payload[0]?.payload as ChartPoint | undefined;
	if (!point) return null;

	const amount = formatCurrencyWithCode(point.amount, point.currency);
	const timeLabel = point.timestamp
		? formatDateTime(point.timestamp)
		: point.timeLabel;

	return (
		<div className="rounded border border-border bg-card/95 p-3 text-xs shadow">
			<p className="text-xs text-muted-foreground">{timeLabel}</p>
			<p className="text-sm font-semibold text-foreground">{amount}</p>
			<p className="text-xs text-muted-foreground capitalize">
				{point.type} transaction
			</p>
		</div>
	);
}

interface SuspiciousTransactionChartProps {
	transactions: Transaction[];
}

export default function SuspiciousTransactionChart({
	transactions,
}: SuspiciousTransactionChartProps) {
	const data: ChartPoint[] = transactions.map((tx) => ({
		time: toHourDecimal(tx.timestamp),
		timeLabel: formatTimeLabel(tx.timestamp),
		timestamp: tx.timestamp,
		amount: tx.amount,
		currency: normalizeCurrency(tx.currency),
		type: tx.isFraud || tx.fraudTag ? "suspicious" : "normal",
	}));

	const suspiciousCount = data.filter(
		(item) => item.type === "suspicious",
	).length;

	return (
		<div className="w-full">
			<ResponsiveContainer width="100%" minHeight={400}>
				<ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
					<CartesianGrid strokeDasharray="3 3" stroke="#e8e6e1" />
					<XAxis
						type="number"
						dataKey="time"
						name="Time (24h)"
						stroke="#6b7280"
						domain={[0, 24]}
						tickFormatter={(value) => formatHourDecimalLabel(Number(value))}
						label={{
							value: "Time of Day (24h)",
							position: "insideBottomRight",
							offset: -10,
						}}
					/>
					<YAxis
						type="number"
						dataKey="amount"
						name="Amount"
						stroke="#6b7280"
						label={{
							value: "Transaction Amount",
							angle: -90,
							position: "insideLeft",
						}}
					/>
					<Tooltip
						cursor={{ strokeDasharray: "3 3" }}
						contentStyle={{
							backgroundColor: "#ffffff",
							border: "1px solid #e8e6e1",
							borderRadius: "4px",
						}}
						content={<CustomTooltip />}
					/>
					<Scatter
						name="Suspicious Transactions"
						data={data.filter((d) => d.type === "suspicious")}
						fill="#c73e3a"
						fillOpacity={0.8}
					/>
					<Scatter
						name="Normal Transactions"
						data={data.filter((d) => d.type === "normal")}
						fill="#a0a0a0"
						fillOpacity={0.4}
					/>
				</ScatterChart>
			</ResponsiveContainer>

			<div className="mt-4 p-4 bg-destructive/10 border border-destructive/30 rounded">
				<p className="text-sm text-foreground">
					<strong>Pattern Analysis:</strong> {suspiciousCount} suspicious
					transactions flagged from the alert evidence set.
				</p>
			</div>
		</div>
	);
}
