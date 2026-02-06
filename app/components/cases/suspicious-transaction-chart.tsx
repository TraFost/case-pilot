"use client";

import {
	ScatterChart,
	Scatter,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";

type Transaction = {
	amount: number;
	timestamp: number;
	isFraud: boolean;
	fraudTag?: string | null;
};

interface SuspiciousTransactionChartProps {
	transactions: Transaction[];
}

function toHourDecimal(timestamp: number) {
	const date = new Date(timestamp);
	return date.getHours() + date.getMinutes() / 60;
}

export default function SuspiciousTransactionChart({
	transactions,
}: SuspiciousTransactionChartProps) {
	const data = transactions.map((tx) => ({
		time: toHourDecimal(tx.timestamp),
		amount: tx.amount,
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
						label={{
							value: "Time of Day (24h)",
							position: "insideBottomRight",
							offset: -10,
						}}
					/>
					<YAxis
						type="number"
						dataKey="amount"
						name="Amount ($)"
						stroke="#6b7280"
						label={{
							value: "Transaction Amount ($)",
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
						formatter={(value, name) => {
							if (name === "amount") return `$${value}`;
							return value;
						}}
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
