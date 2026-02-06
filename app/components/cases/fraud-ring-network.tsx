export default function FraudRingNetwork() {
	return (
		<div className="w-full bg-muted/30 rounded p-8 flex flex-col items-center">
			<svg viewBox="0 0 600 400" className="w-full h-80">
				{/* Central suspect node */}
				<circle cx="300" cy="200" r="35" fill="#c73e3a" opacity="0.9" />
				<text
					x="300"
					y="207"
					textAnchor="middle"
					fontSize="12"
					fontWeight="bold"
					fill="white"
				>
					U-882
				</text>

				{/* Branch lines with defs for animation */}
				<defs>
					<style>{`
            @keyframes particleFlow {
              0% { offset-distance: 0%; opacity: 1; }
              100% { offset-distance: 100%; opacity: 0; }
            }
            .particle {
              animation: particleFlow 2s infinite;
            }
          `}</style>
				</defs>

				{/* Branch lines */}
				<line
					x1="300"
					y1="200"
					x2="120"
					y2="100"
					stroke="#7c9082"
					strokeWidth="2"
					strokeDasharray="5,5"
				/>
				<line
					x1="300"
					y1="200"
					x2="480"
					y2="100"
					stroke="#7c9082"
					strokeWidth="2"
					strokeDasharray="5,5"
				/>
				<line
					x1="300"
					y1="200"
					x2="120"
					y2="300"
					stroke="#7c9082"
					strokeWidth="2"
					strokeDasharray="5,5"
				/>
				<line
					x1="300"
					y1="200"
					x2="480"
					y2="300"
					stroke="#7c9082"
					strokeWidth="2"
					strokeDasharray="5,5"
				/>

				{/* Animated money flow particles - M1 to Central */}
				<g>
					<circle cx="60" cy="150" r="3" fill="#f9a825" opacity="0.8">
						<animateMotion dur="1.5s" repeatCount="indefinite">
							<mpath href="#path1" />
						</animateMotion>
					</circle>
					<circle cx="60" cy="150" r="3" fill="#f9a825" opacity="0.6">
						<animateMotion dur="1.5s" repeatCount="indefinite" begin="0.5s">
							<mpath href="#path1" />
						</animateMotion>
					</circle>
					<circle cx="60" cy="150" r="3" fill="#f9a825" opacity="0.4">
						<animateMotion dur="1.5s" repeatCount="indefinite" begin="1s">
							<mpath href="#path1" />
						</animateMotion>
					</circle>
					<path id="path1" d="M 60 150 L 120 100 L 300 200" fill="none" />
				</g>

				{/* Animated money flow particles - M2 to Central */}
				<g>
					<circle cx="540" cy="150" r="3" fill="#f9a825" opacity="0.8">
						<animateMotion dur="1.5s" repeatCount="indefinite">
							<mpath href="#path2" />
						</animateMotion>
					</circle>
					<circle cx="540" cy="150" r="3" fill="#f9a825" opacity="0.6">
						<animateMotion dur="1.5s" repeatCount="indefinite" begin="0.5s">
							<mpath href="#path2" />
						</animateMotion>
					</circle>
					<circle cx="540" cy="150" r="3" fill="#f9a825" opacity="0.4">
						<animateMotion dur="1.5s" repeatCount="indefinite" begin="1s">
							<mpath href="#path2" />
						</animateMotion>
					</circle>
					<path id="path2" d="M 540 150 L 480 100 L 300 200" fill="none" />
				</g>

				{/* Animated money flow particles - M3 to Central */}
				<g>
					<circle cx="60" cy="250" r="3" fill="#f9a825" opacity="0.8">
						<animateMotion dur="1.5s" repeatCount="indefinite">
							<mpath href="#path3" />
						</animateMotion>
					</circle>
					<circle cx="60" cy="250" r="3" fill="#f9a825" opacity="0.6">
						<animateMotion dur="1.5s" repeatCount="indefinite" begin="0.5s">
							<mpath href="#path3" />
						</animateMotion>
					</circle>
					<circle cx="60" cy="250" r="3" fill="#f9a825" opacity="0.4">
						<animateMotion dur="1.5s" repeatCount="indefinite" begin="1s">
							<mpath href="#path3" />
						</animateMotion>
					</circle>
					<path id="path3" d="M 60 250 L 120 300 L 300 200" fill="none" />
				</g>

				{/* Animated money flow particles - M4 to Central */}
				<g>
					<circle cx="540" cy="250" r="3" fill="#f9a825" opacity="0.8">
						<animateMotion dur="1.5s" repeatCount="indefinite">
							<mpath href="#path4" />
						</animateMotion>
					</circle>
					<circle cx="540" cy="250" r="3" fill="#f9a825" opacity="0.6">
						<animateMotion dur="1.5s" repeatCount="indefinite" begin="0.5s">
							<mpath href="#path4" />
						</animateMotion>
					</circle>
					<circle cx="540" cy="250" r="3" fill="#f9a825" opacity="0.4">
						<animateMotion dur="1.5s" repeatCount="indefinite" begin="1s">
							<mpath href="#path4" />
						</animateMotion>
					</circle>
					<path id="path4" d="M 540 250 L 480 300 L 300 200" fill="none" />
				</g>

				{/* Shared infrastructure nodes */}
				{/* Shared Wallet */}
				<circle cx="120" cy="100" r="28" fill="#f9a825" opacity="0.8" />
				<text
					x="120"
					y="107"
					textAnchor="middle"
					fontSize="11"
					fontWeight="bold"
					fill="white"
				>
					Wallet
				</text>

				{/* Shared IP */}
				<circle cx="480" cy="100" r="28" fill="#f9a825" opacity="0.8" />
				<text
					x="480"
					y="107"
					textAnchor="middle"
					fontSize="11"
					fontWeight="bold"
					fill="white"
				>
					IP Addr
				</text>

				{/* Device Fingerprint */}
				<circle cx="120" cy="300" r="28" fill="#f9a825" opacity="0.8" />
				<text
					x="120"
					y="307"
					textAnchor="middle"
					fontSize="11"
					fontWeight="bold"
					fill="white"
				>
					Device
				</text>

				{/* Outer mule accounts */}
				{/* Mule 1 */}
				<circle cx="60" cy="150" r="20" fill="#a0a0a0" opacity="0.6" />
				<text x="60" y="156" textAnchor="middle" fontSize="9" fill="white">
					M-441
				</text>
				<line
					x1="120"
					y1="100"
					x2="60"
					y2="150"
					stroke="#c73e3a"
					strokeWidth="1"
					opacity="0.5"
				/>

				{/* Mule 2 */}
				<circle cx="540" cy="150" r="20" fill="#a0a0a0" opacity="0.6" />
				<text x="540" y="156" textAnchor="middle" fontSize="9" fill="white">
					M-892
				</text>
				<line
					x1="480"
					y1="100"
					x2="540"
					y2="150"
					stroke="#c73e3a"
					strokeWidth="1"
					opacity="0.5"
				/>

				{/* Mule 3 */}
				<circle cx="60" cy="250" r="20" fill="#a0a0a0" opacity="0.6" />
				<text x="60" y="256" textAnchor="middle" fontSize="9" fill="white">
					M-556
				</text>
				<line
					x1="120"
					y1="300"
					x2="60"
					y2="250"
					stroke="#c73e3a"
					strokeWidth="1"
					opacity="0.5"
				/>

				{/* Mule 4 */}
				<circle cx="540" cy="250" r="20" fill="#a0a0a0" opacity="0.6" />
				<text x="540" y="256" textAnchor="middle" fontSize="9" fill="white">
					M-773
				</text>
				<line
					x1="480"
					y1="300"
					x2="540"
					y2="250"
					stroke="#c73e3a"
					strokeWidth="1"
					opacity="0.5"
				/>

				{/* Legend */}
				<text x="20" y="380" fontSize="11" fill="#6b7280" fontWeight="bold">
					Central Suspect
				</text>
				<circle cx="12" cy="370" r="6" fill="#c73e3a" />

				<text x="150" y="380" fontSize="11" fill="#6b7280" fontWeight="bold">
					Shared Infrastructure
				</text>
				<circle cx="140" cy="370" r="6" fill="#f9a825" />

				<text x="350" y="380" fontSize="11" fill="#6b7280" fontWeight="bold">
					Mule Accounts
				</text>
				<circle cx="340" cy="370" r="6" fill="#a0a0a0" />
			</svg>

			<div className="mt-4 p-4 bg-primary/10 border border-primary/30 rounded">
				<p className="text-sm text-foreground">
					<strong>Network Analysis:</strong> 4 linked accounts share the same IP
					address, device fingerprint, and wallet destination. Pattern indicates
					organized fraud ring with U-882 as primary operator and M-441, M-892,
					M-556, M-773 as mule accounts.
				</p>
			</div>
		</div>
	);
}
