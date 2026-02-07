import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import { Button } from "@/app/components/ui/button";

interface ChartDataPoint {
	time: string;
	riskScore: number;
}

interface LiveAttackChartProps {
	data: ChartDataPoint[];
	isAttackMode: boolean;
	onInjectAttack: () => void;
}

export default function LiveAttackChart({
	data,
	isAttackMode,
	onInjectAttack,
}: LiveAttackChartProps) {
	return (
		<div className="bg-card rounded border border-border p-6 shadow-sm">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h2 className="text-lg font-semibold text-foreground">
						Live Risk Score
					</h2>
					<p className="text-sm text-muted-foreground">
						Last 30 minutes of coordinated attack patterns
					</p>
				</div>
				<Button
					onClick={onInjectAttack}
					disabled={isAttackMode}
					className={`${
						isAttackMode
							? "bg-destructive text-destructive-foreground animate-pulse"
							: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
					}`}
				>
					{isAttackMode ? "ATTACK IN PROGRESS" : "INJECT LIVE ATTACK"}
				</Button>
			</div>

			<div className="w-full h-80">
				<ResponsiveContainer width="100%" height="100%">
					<AreaChart data={data}>
						<defs>
							<linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
								<stop
									offset="5%"
									stopColor={isAttackMode ? "#c73e3a" : "#7c9082"}
									stopOpacity={0.8}
								/>
								<stop
									offset="95%"
									stopColor={isAttackMode ? "#c73e3a" : "#7c9082"}
									stopOpacity={0.1}
								/>
							</linearGradient>
						</defs>
						<CartesianGrid strokeDasharray="3 3" stroke="#e8e6e1" />
						<XAxis dataKey="time" stroke="#6b7280" />
						<YAxis stroke="#6b7280" domain={[0, 100]} />
						<Tooltip
							contentStyle={{
								backgroundColor: "#ffffff",
								border: "1px solid #e8e6e1",
								borderRadius: "4px",
							}}
							formatter={(value) => [`Risk: ${value}`, "Score"]}
						/>
						<Area
							type="monotone"
							dataKey="riskScore"
							stroke={isAttackMode ? "#c73e3a" : "#7c9082"}
							strokeWidth={2}
							fillOpacity={1}
							fill="url(#colorRisk)"
						/>
					</AreaChart>
				</ResponsiveContainer>
			</div>

			{isAttackMode && (
				<div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded">
					<p className="text-sm font-medium text-destructive">
						COORDINATED ATTACK DETECTED - Multiple fraud rings active
					</p>
				</div>
			)}
		</div>
	);
}
