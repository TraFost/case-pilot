type TimelineItem = {
	time: string;
	event: string;
};

interface CaseReportProps {
	summary: string;
	confidence: number;
	recommendedAction: string;
	topSignals: string[];
	timeline: TimelineItem[];
}

export default function CaseReport({
	summary,
	confidence,
	recommendedAction,
	topSignals,
	timeline,
}: CaseReportProps) {
	const confidencePercent = Math.round(confidence * 100);

	return (
		<div className="bg-card rounded border border-border p-6 shadow-sm">
			<h2 className="text-lg font-semibold text-foreground mb-4">
				AI Case Report
			</h2>

			<div className="space-y-5">
				<div>
					<h3 className="text-sm font-semibold text-foreground mb-2">
						Summary
					</h3>
					<p className="text-xs text-muted-foreground leading-relaxed">
						{summary || "AI summary is still processing."}
					</p>
				</div>

				<div>
					<h3 className="text-sm font-semibold text-foreground mb-3">
						Top Signals
					</h3>
					{topSignals.length === 0 ? (
						<p className="text-xs text-muted-foreground">
							No signals available yet
						</p>
					) : (
						<ul className="space-y-2">
							{topSignals.map((signal, idx) => (
								<li
									key={idx}
									className="flex gap-2 text-xs text-muted-foreground"
								>
									<span className="text-primary">•</span>
									<span>{signal}</span>
								</li>
							))}
						</ul>
					)}
				</div>

				<div>
					<h3 className="text-sm font-semibold text-foreground mb-2">
						Timeline Reconstruction
					</h3>
					{timeline.length === 0 ? (
						<p className="text-xs text-muted-foreground">
							No AI timeline available yet
						</p>
					) : (
						<div className="space-y-2 text-xs">
							{timeline.map((item, idx) => (
								<div key={idx} className="flex gap-2">
									<span className="font-mono text-primary w-16">
										{item.time}
									</span>
									<span className="text-muted-foreground">{item.event}</span>
								</div>
							))}
						</div>
					)}
				</div>

				<div>
					<h3 className="text-sm font-semibold text-foreground mb-2">
						Confidence Score
					</h3>
					<div className="w-full bg-muted h-2 rounded overflow-hidden">
						<div
							className="h-full bg-destructive"
							style={{ width: `${confidencePercent}%` }}
						></div>
					</div>
					<p className="text-xs text-destructive font-semibold mt-2">
						{confidencePercent}% Fraud Confidence
					</p>
				</div>

				<div className="text-xs text-muted-foreground">
					Recommended action: {recommendedAction || "Pending"}
				</div>
			</div>
		</div>
	);
}
