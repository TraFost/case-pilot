import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";

import { Doc } from "@/convex/_generated/dataModel";

type Alert = Doc<"alerts"> & { username: string | null };

interface AlertsTableProps {
	alerts: Alert[];
}

function getRiskColor(score: number) {
	if (score >= 90)
		return "bg-destructive/15 text-destructive border-destructive/30";
	if (score >= 80) return "bg-orange-100 text-orange-900 border-orange-300";
	if (score >= 70) return "bg-yellow-100 text-yellow-900 border-yellow-300";
	return "bg-muted text-muted-foreground border-border";
}

function getStatusBadgeVariant(status: string) {
	switch (status) {
		case "New":
			return "bg-destructive/15 text-destructive border border-destructive/30";
		case "Investigating":
			return "bg-secondary text-secondary-foreground";
		case "Resolved":
			return "bg-muted text-muted-foreground";
		default:
			return "bg-muted text-muted-foreground";
	}
}

export default function AlertsTable({ alerts }: AlertsTableProps) {
	const router = useRouter();

	return (
		<div className="bg-card rounded border border-border p-6 shadow-sm">
			<div className="mb-6">
				<h2 className="text-lg font-semibold text-foreground">
					Active Alert Queue
				</h2>
				<p className="text-sm text-muted-foreground">
					{alerts.length} active alerts • Click to investigate
				</p>
			</div>

			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-border">
							<th className="text-left py-3 px-4 font-semibold text-foreground">
								Alert ID
							</th>
							<th className="text-left py-3 px-4 font-semibold text-foreground">
								Account
							</th>
							<th className="text-left py-3 px-4 font-semibold text-foreground">
								Trigger
							</th>
							<th className="text-left py-3 px-4 font-semibold text-foreground">
								Risk Score
							</th>
							<th className="text-left py-3 px-4 font-semibold text-foreground">
								Status
							</th>
						</tr>
					</thead>
					<tbody>
						{alerts.map((alert) => (
							<tr
								key={alert._id}
								onClick={() => router.push(`/cases/${alert._id}`)}
								className={`border-b border-border hover:bg-muted/30 transition-colors cursor-pointer ${
									alert.riskScore >= 90 ? "bg-destructive/5" : ""
								}`}
							>
								<td className="py-3 px-4">
									<span className="font-mono text-primary">{alert._id}</span>
								</td>
								<td className="py-3 px-4 text-foreground">
									{alert.username ?? "Unknown"}
								</td>
								<td className="py-3 px-4 text-foreground text-xs">
									{alert.trigger}
								</td>
								<td className="py-3 px-4">
									<div
										className={`inline-flex items-center justify-center w-12 h-8 rounded font-semibold border ${getRiskColor(
											alert.riskScore,
										)}`}
									>
										{alert.riskScore}
									</div>
								</td>
								<td className="py-3 px-4">
									<Badge className={getStatusBadgeVariant(alert.status)}>
										{alert.status}
									</Badge>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
