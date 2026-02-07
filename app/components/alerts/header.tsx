export default function Header() {
	return (
		<header className="border-b border-border bg-card">
			<div className="px-6 py-4 flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-serif font-bold text-foreground">
						CasePilot
					</h1>
					<p className="text-sm text-muted-foreground">
						Fraud Investigation Copilot
					</p>
				</div>

				<div className="flex items-center gap-4">
					<div className="text-right">
						<p className="text-sm font-medium text-foreground">
							Rahman Nurudin
						</p>
						<p className="text-xs text-muted-foreground">Analyst</p>
					</div>
					<div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
						<span className="text-primary-foreground font-semibold">RN</span>
					</div>
				</div>
			</div>
		</header>
	);
}
