import { Badge } from "@/components/ui/badge";

export type SimilarCaseResult = {
	caseId: string;
	caseSummary: string;
	caseStatus: string;
	userName: string;
	outcome: string;
	outcomeNotes: string | null;
	similarity: number;
	evidenceText: string;
};

interface SimilarCasesCardProps {
	results: SimilarCaseResult[];
	isLoading: boolean;
}

function formatOutcomeLabel(outcome: string) {
	switch (outcome) {
		case "FREEZE":
			return "FROZEN";
		case "RESOLVE":
			return "RESOLVED";
		default:
			return outcome;
	}
}

function formatShortId(id: string) {
	const trimmed = id.trim();
	if (trimmed.length <= 6) return trimmed;
	return trimmed.slice(-6).toUpperCase();
}

export default function SimilarCasesCard({
	results,
	isLoading,
}: SimilarCasesCardProps) {
	const primary = results[0];

	return (
		<div className="bg-card rounded border border-border p-6 shadow-sm">
			<h2 className="text-lg font-semibold text-foreground mb-2">
				Similar Cases
			</h2>
			<p className="text-sm text-muted-foreground mb-4">
				RAG matches from prior investigations
			</p>

			{isLoading ? (
				<p className="text-sm text-muted-foreground">Scanning precedents...</p>
			) : !primary ? (
				<p className="text-sm text-muted-foreground">No precedent found yet.</p>
			) : (
				<div className="space-y-4">
					<div className="rounded border border-destructive/30 bg-destructive/10 p-4">
						<p className="text-sm font-semibold text-destructive">
							Precedent Found
						</p>
						<p className="mt-2 text-sm text-foreground">
							This case is {primary.similarity}% similar to Case #
							{formatShortId(primary.caseId)} ({primary.userName}) which was{" "}
							{formatOutcomeLabel(primary.outcome)}.
						</p>
					</div>

					<div className="space-y-2 text-xs text-muted-foreground">
						<p className="text-foreground">Evidence match</p>
						<p>{primary.evidenceText}</p>
						{primary.outcomeNotes && (
							<p className="text-muted-foreground">{primary.outcomeNotes}</p>
						)}
						<div className="flex flex-wrap gap-2">
							<Badge variant="outline">Case: {primary.caseStatus}</Badge>
							<Badge variant="outline">
								Outcome: {formatOutcomeLabel(primary.outcome)}
							</Badge>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
