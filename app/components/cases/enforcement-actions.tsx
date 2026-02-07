import { useState } from "react";
import { Button } from "@/components/ui/button";

import { toast } from "sonner";

interface EnforcementActionsProps {
	onAction: (actionName: string) => Promise<void>;
	alertStatus?: string;
	userStatus?: string | null;
}

export default function EnforcementActions({
	onAction,
	alertStatus,
	userStatus,
}: EnforcementActionsProps) {
	const [loading, setLoading] = useState<string | null>(null);
	const isFrozen = userStatus === "Frozen";
	const isResolved = alertStatus === "Resolved";

	const handleAction = async (actionName: string) => {
		setLoading(actionName);

		try {
			await onAction(actionName);
			toast(`Action Executed: ${actionName}`, {
				description: `${actionName} - Audit Logged`,
			});
		} catch (error) {
			console.error(error);
			toast(`Action Failed: ${actionName}`, {
				description: "Please retry or check logs.",
			});
		} finally {
			setLoading(null);
		}
	};

	return (
		<div className="bg-card rounded border border-border p-6 shadow-sm">
			<h2 className="text-lg font-semibold text-foreground mb-4">
				Enforcement Actions
			</h2>

			<div className="space-y-3">
				{/* Freeze - Confirmed Fraud */}
				<Button
					onClick={() => handleAction("FREEZE")}
					disabled={loading !== null || isFrozen}
					className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
				>
					{loading === "FREEZE" ? "Processing..." : "FREEZE (CONFIRMED FRAUD)"}
				</Button>

				{/* Resolve - False Positive */}
				<Button
					onClick={() => handleAction("RESOLVE")}
					disabled={loading !== null || isResolved}
					className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
				>
					{loading === "RESOLVE" ? "Processing..." : "RESOLVE (FALSE POSITIVE)"}
				</Button>
			</div>

			<div className="mt-4 p-3 bg-muted/30 rounded text-xs text-muted-foreground">
				<p className="font-semibold text-foreground mb-1">Remember:</p>
				<p>All actions are logged and require justification in audit trail.</p>
			</div>
		</div>
	);
}
