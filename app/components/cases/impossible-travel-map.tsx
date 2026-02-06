"use client";

export default function ImpossibleTravelMap() {
	return (
		<div className="w-full rounded border border-border bg-card p-6 shadow-sm">
			<h3 className="text-lg font-semibold text-foreground mb-4">
				Geographic Inconsistency: Impossible Travel
			</h3>

			<svg viewBox="0 0 800 400" className="w-full h-64 mb-4">
				<defs>
					<linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stopColor="#e8e6e1" stopOpacity="0.3" />
						<stop offset="100%" stopColor="#e8e6e1" stopOpacity="0.1" />
					</linearGradient>
					<marker
						id="arrowhead"
						markerWidth="10"
						markerHeight="10"
						refX="9"
						refY="3"
						orient="auto"
					>
						<polygon points="0 0, 10 3, 0 6" fill="#c73e3a" />
					</marker>
				</defs>

				{/* Background */}
				<rect width="800" height="400" fill="url(#mapGradient)" />

				{/* Simplified continent shapes */}
				<g opacity="0.2" fill="#bfc9bb" stroke="#7c9082" strokeWidth="1">
					{/* Asia outline (simplified) */}
					<path d="M 500 150 L 600 140 L 620 160 L 610 200 L 580 210 L 540 190 Z" />
					{/* Africa outline (simplified) */}
					<path d="M 480 200 L 520 190 L 530 270 L 500 280 L 470 260 Z" />
					{/* Europe outline (simplified) */}
					<path d="M 400 120 L 450 110 L 460 150 L 440 160 L 410 150 Z" />
				</g>

				<circle cx="520" cy="240" r="8" fill="#7c9082" />
				<circle
					cx="520"
					cy="240"
					r="12"
					fill="none"
					stroke="#7c9082"
					strokeWidth="2"
					opacity="0.5"
				/>
				<text
					x="520"
					y="270"
					textAnchor="middle"
					fontSize="12"
					fontWeight="bold"
					fill="#1a1f2e"
				>
					Jakarta
				</text>
				<text x="520" y="285" textAnchor="middle" fontSize="10" fill="#6b7280">
					6-Jan, 14:32 UTC
				</text>

				<circle cx="420" cy="200" r="8" fill="#c73e3a" />
				<circle
					cx="420"
					cy="200"
					r="12"
					fill="none"
					stroke="#c73e3a"
					strokeWidth="2"
					opacity="0.5"
				/>
				<text
					x="420"
					y="170"
					textAnchor="middle"
					fontSize="12"
					fontWeight="bold"
					fill="#1a1f2e"
				>
					Dubai
				</text>
				<text x="420" y="155" textAnchor="middle" fontSize="10" fill="#6b7280">
					6-Jan, 14:33 UTC
				</text>

				<path
					d="M 520 240 Q 470 220 420 200"
					stroke="#c73e3a"
					strokeWidth="3"
					fill="none"
					markerEnd="url(#arrowhead)"
					opacity="0.8"
				/>

				<path
					d="M 520 240 Q 470 220 420 200"
					stroke="#c73e3a"
					strokeWidth="2"
					fill="none"
					strokeDasharray="8,4"
					opacity="0.4"
					style={{
						animation: "dashMove 2s linear infinite",
					}}
				/>

				<text x="470" y="205" fontSize="11" fill="#c73e3a" fontWeight="bold">
					4,100 km
				</text>
			</svg>

			<div className="grid grid-cols-2 gap-4 mb-4">
				<div className="bg-muted/30 border border-border rounded p-3">
					<p className="text-xs text-muted-foreground mb-1">Time Delta</p>
					<p className="text-sm font-semibold text-foreground">1 minute</p>
				</div>
				<div className="bg-destructive/10 border border-destructive/30 rounded p-3">
					<p className="text-xs text-muted-foreground mb-1">Required Speed</p>
					<p className="text-sm font-semibold text-destructive">
						5,000 km/h (Impossible)
					</p>
				</div>
			</div>

			<div className="bg-destructive/5 border border-destructive/20 rounded p-3">
				<p className="text-xs text-muted-foreground mb-1">
					<strong>Interpretation:</strong>
				</p>
				<p className="text-sm text-foreground">
					User logged in from Jakarta (6-Jan 14:32 UTC), then immediately from
					Dubai (6-Jan 14:33 UTC). This violates physical laws—indicates account
					takeover, VPN proxy abuse, or credential sharing.
				</p>
			</div>

			<style>{`
        @keyframes dashMove {
          to {
            stroke-dashoffset: -12;
          }
        }
      `}</style>
		</div>
	);
}
