import { useMemo, useState } from "react";
import {
	ComposableMap,
	ZoomableGroup,
	Geographies,
	Geography,
	Marker,
	Line,
} from "react-simple-maps";
import { formatDateTime } from "@/utils/date.util";
import { getCountryCoordinates } from "@/utils/country-coords.util";

const GEO_URL =
	"https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

type Transaction = {
	timestamp: number;
	meta?: {
		location?:
			| {
					countryCode?: string;
					country?: string;
					address?: unknown;
			  }
			| string;
	};
};

interface ImpossibleTravelMapProps {
	transactions: Transaction[];
}

type GeoPoint = {
	coords: [number, number];
	label: string;
	timestamp: number;
};

function toRadians(value: number) {
	return (value * Math.PI) / 180;
}

function haversineKm(a: [number, number], b: [number, number]) {
	const [lon1, lat1] = a;
	const [lon2, lat2] = b;
	const r = 6371;
	const dLat = toRadians(lat2 - lat1);
	const dLon = toRadians(lon2 - lon1);
	const lat1Rad = toRadians(lat1);
	const lat2Rad = toRadians(lat2);

	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) ** 2;
	return 2 * r * Math.asin(Math.sqrt(h));
}

function formatDistance(distanceKm: number) {
	return `${Math.round(distanceKm).toLocaleString("en-US")} km`;
}

function formatTimeDelta(ms: number) {
	const totalMinutes = Math.max(1, Math.round(ms / 60000));
	if (totalMinutes < 60) return `${totalMinutes} min`;
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	return `${hours}h ${minutes}m`;
}

export default function ImpossibleTravelMap({
	transactions,
}: ImpossibleTravelMapProps) {
	const [zoom, setZoom] = useState(1);
	const [center, setCenter] = useState<[number, number]>([80, 10]);
	const points = useMemo(() => {
		return transactions
			.map((tx) => {
				const location = tx.meta?.location;
				const coords =
					typeof location === "string"
						? getCountryCoordinates({ countryName: location })
						: getCountryCoordinates({
								countryCode: location?.countryCode,
								countryName: location?.country,
							});
				if (!coords) return null;
				return {
					coords: [coords.lon, coords.lat],
					label: coords.name,
					timestamp: tx.timestamp,
				};
			})
			.filter(Boolean) as GeoPoint[];
	}, [transactions]);

	const travel = useMemo(() => {
		if (points.length < 2) return null;

		let best: { a: GeoPoint; b: GeoPoint; distance: number } | null = null;
		for (let i = 0; i < points.length; i += 1) {
			for (let j = i + 1; j < points.length; j += 1) {
				const distance = haversineKm(points[i].coords, points[j].coords);
				if (!best || distance > best.distance) {
					best = { a: points[i], b: points[j], distance };
				}
			}
		}

		if (!best) return null;
		const timeDelta = Math.abs(best.a.timestamp - best.b.timestamp);
		const hours = timeDelta / (1000 * 60 * 60);
		const speed = hours > 0 ? best.distance / hours : best.distance;

		return {
			...best,
			timeDelta,
			speed,
		};
	}, [points]);
	const highlightedCountries = useMemo(
		() => new Set(points.map((point) => point.label)),
		[points],
	);
	const uniquePoints = useMemo(() => {
		const map = new Map<string, GeoPoint>();
		for (const point of points) {
			if (!map.has(point.label)) {
				map.set(point.label, point);
			}
		}
		return Array.from(map.values());
	}, [points]);
	const visitedCountries = useMemo(
		() => uniquePoints.map((point) => point.label).sort(),
		[uniquePoints],
	);

	return (
		<div className="w-full bg-card rounded-xl border p-6 shadow-sm">
			<div className="mb-4">
				<h3 className="text-lg font-semibold flex items-center gap-2">
					Geographic Anomaly Detected
				</h3>
				<p className="text-sm text-muted-foreground">
					Distance:{" "}
					<span className="text-foreground font-mono">
						{travel ? formatDistance(travel.distance) : "N/A"}
					</span>{" "}
					• Time Delta:{" "}
					<span className="text-foreground font-mono">
						{travel ? formatTimeDelta(travel.timeDelta) : "N/A"}
					</span>{" "}
					• Speed:{" "}
					<span className="text-red-500 font-bold font-mono">
						{travel
							? `${Math.round(travel.speed).toLocaleString("en-US")} km/h`
							: "N/A"}
					</span>
				</p>
			</div>

			<div className="w-full h-75 overflow-hidden rounded-lg bg-slate-900/50 border border-slate-800 relative">
				<div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
					<button
						type="button"
						onClick={() => setZoom((prev) => Math.min(4, prev + 0.4))}
						className="h-8 w-8 rounded-md border border-slate-700/70 bg-slate-900/70 text-sm font-semibold text-slate-100"
						aria-label="Zoom in"
					>
						+
					</button>
					<button
						type="button"
						onClick={() => setZoom((prev) => Math.max(1, prev - 0.4))}
						className="h-8 w-8 rounded-md border border-slate-700/70 bg-slate-900/70 text-sm font-semibold text-slate-100"
						aria-label="Zoom out"
					>
						-
					</button>
					<button
						type="button"
						onClick={() => {
							setZoom(1);
							setCenter([80, 10]);
						}}
						className="h-8 w-8 rounded-md border border-slate-700/70 bg-slate-900/70 text-xs font-semibold text-slate-100"
						aria-label="Reset view"
					>
						1x
					</button>
				</div>
				<ComposableMap
					projection="geoMercator"
					projectionConfig={{
						scale: 120,
						center: [80, 10],
					}}
					className="w-full h-full"
				>
					<ZoomableGroup
						zoom={zoom}
						center={center}
						onMoveEnd={(position) => {
							setCenter(position.coordinates as [number, number]);
							setZoom(position.zoom);
						}}
					>
						<Geographies geography={GEO_URL}>
							{({ geographies }) =>
								geographies.map((geo) => {
									const isTarget = highlightedCountries.has(
										geo.properties.name,
									);
									return (
										<Geography
											key={geo.rsmKey}
											geography={geo}
											fill={isTarget ? "#475569" : "#1e293b"}
											stroke="#0f172a"
											strokeWidth={0.5}
											style={{
												default: { outline: "none" },
												hover: { fill: "#334155", outline: "none" },
												pressed: { outline: "none" },
											}}
										/>
									);
								})
							}
						</Geographies>

						{travel && (
							<Line
								from={travel.a.coords}
								to={travel.b.coords}
								stroke="#ef4444"
								strokeWidth={2}
								strokeLinecap="round"
								strokeDasharray="4 4"
								className="animate-dash"
							/>
						)}

						{uniquePoints.map((point) => (
							<Marker key={point.label} coordinates={point.coords}>
								<circle r={3} fill="#38bdf8" stroke="#0f172a" strokeWidth={1} />
								<text
									y={-18}
									textAnchor="middle"
									className="text-[10px] font-semibold fill-slate-100"
								>
									<tspan x="0" dy="0">
										{point.label}
									</tspan>
									<tspan x="0" dy="12" className="font-normal fill-slate-300">
										{formatDateTime(point.timestamp)}
									</tspan>
								</text>
							</Marker>
						))}

						{travel && (
							<Marker coordinates={travel.a.coords}>
								<circle r={4} fill="#ef4444" stroke="#fff" strokeWidth={2} />
							</Marker>
						)}

						{travel && (
							<Marker coordinates={travel.b.coords}>
								<circle r={4} fill="#ef4444" stroke="#fff" strokeWidth={2} />
							</Marker>
						)}
					</ZoomableGroup>
				</ComposableMap>

				{travel && (
					<div className="absolute bottom-4 left-4 bg-red-500/10 border border-red-500/30 p-2 rounded text-xs text-red-200">
						<b>IMPOSSIBLE TRAVEL:</b> User cannot physically traverse this
						distance in the observed time window.
					</div>
				)}
				{!travel && (
					<div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
						Not enough geo data to plot travel.
					</div>
				)}
			</div>

			<div className="mt-4 rounded-lg border border-border bg-muted/20 p-4">
				<p className="text-xs text-muted-foreground mb-2">Visited countries</p>
				{visitedCountries.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No location data found.
					</p>
				) : (
					<div className="flex flex-wrap gap-2">
						{visitedCountries.map((country) => (
							<span
								key={country}
								className="rounded-full border border-slate-700/40 bg-slate-900/30 px-2.5 py-1 text-[11px] text-slate-100"
							>
								{country}
							</span>
						))}
					</div>
				)}
			</div>

			<style jsx global>{`
				.animate-dash {
					animation: dash 1s linear infinite;
				}
				@keyframes dash {
					to {
						stroke-dashoffset: -8;
					}
				}
			`}</style>
		</div>
	);
}
