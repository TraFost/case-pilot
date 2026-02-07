import { useEffect } from "react";
import {
	ReactFlow,
	Background,
	Controls,
	MiniMap,
	useNodesState,
	useEdgesState,
	Handle,
	Position,
	type Node,
	type Edge,
	useReactFlow,
	ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useQuery } from "convex/react";
import {
	forceSimulation,
	forceLink,
	forceManyBody,
	forceCenter,
	forceCollide,
	type SimulationNodeDatum,
} from "d3-force";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type FraudNodeData = {
	label: string;
	type: "suspect" | "shared" | "mule";
};

type GraphNode = Node<FraudNodeData>;
type GraphEdge = Edge;

type SimulationNode = SimulationNodeDatum & {
	id: string;
	x?: number | null;
	y?: number | null;
};

type SimulationEdge = {
	source: string | SimulationNode;
	target: string | SimulationNode;
};

const FraudNode = ({ data }: { data: FraudNodeData }) => {
	const isSuspect = data.type === "suspect";
	const isShared = data.type === "shared";

	const sizeClass = isShared ? "w-16 h-16 text-lg" : "w-12 h-12 text-md";
	const bgColor = isSuspect
		? "bg-red-600 shadow-red-500/50"
		: isShared
			? "bg-amber-500 shadow-amber-500/50"
			: "bg-slate-500 shadow-slate-500/50";

	return (
		<div className="relative flex flex-col items-center group">
			<Handle type="target" position={Position.Top} className="opacity-0" />
			<Handle type="source" position={Position.Bottom} className="opacity-0" />

			<div
				className={`${sizeClass} rounded-full flex items-center justify-center text-white font-bold shadow-xl ${bgColor} border-2 border-white transition-transform duration-200 group-hover:scale-110`}
			>
				{data.type === "shared" ? "⚠️" : data.label.substring(0, 1)}
			</div>

			<div className="absolute top-full mt-2 whitespace-nowrap px-3 py-1 bg-white/90 backdrop-blur border border-slate-200 rounded-full text-[10px] font-bold text-slate-700 shadow-sm z-10">
				{data.label}
			</div>
		</div>
	);
};

const nodeTypes = { fraudNode: FraudNode };

const runForceLayout = (nodes: GraphNode[], edges: GraphEdge[]) => {
	const simulationNodes: SimulationNode[] = nodes.map((node) => ({
		id: node.id,
		x: node.position.x,
		y: node.position.y,
	}));
	const simulationEdges: SimulationEdge[] = edges.map((edge) => ({
		source: edge.source,
		target: edge.target,
	}));

	const simulation = forceSimulation<SimulationNode>(simulationNodes)
		.force("charge", forceManyBody().strength(-500))
		.force(
			"link",
			forceLink<SimulationNode, SimulationEdge>(simulationEdges)
				.id((d) => d.id)
				.distance(150),
		)
		.force("center", forceCenter(400, 300))
		.force("collide", forceCollide().radius(60))
		.stop();

	simulation.tick(300);

	return {
		nodes: nodes.map((node) => {
			const simNode = simulationNodes.find((item) => item.id === node.id);
			return {
				...node,
				position: { x: simNode?.x ?? 0, y: simNode?.y ?? 0 },
			};
		}),
		edges,
	};
};

interface FraudRingNetworkProps {
	alertId: Id<"alerts">;
}

function FraudRingNetworkContent({ alertId }: FraudRingNetworkProps) {
	const network = useQuery(api.cases.getFraudRingNetworkByAlertId, { alertId });
	const [nodes, setNodes, onNodesChange] = useNodesState<GraphNode>([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState<GraphEdge>([]);
	const { fitView } = useReactFlow();

	useEffect(() => {
		if (!network) return;

		const initialNodes: GraphNode[] = network.nodes.map((node) => ({
			id: node.id,
			type: "fraudNode",
			data: { label: node.label, type: node.type },
			position: { x: 0, y: 0 },
		}));
		const initialEdges: GraphEdge[] = network.edges.map((edge) => ({
			id: edge.id,
			source: edge.source,
			target: edge.target,
			animated: true,
			style: { stroke: "#94a3b8", strokeWidth: 1.5, strokeDasharray: "5 5" },
		}));

		const layout = runForceLayout(initialNodes, initialEdges);
		setNodes(layout.nodes);
		setEdges(layout.edges);

		setTimeout(
			() => window.requestAnimationFrame(() => fitView({ padding: 0.2 })),
			100,
		);
	}, [network, setNodes, setEdges, fitView]);

	return (
		<div className="w-full h-125 bg-slate-50/50 border rounded-xl overflow-hidden relative group">
			<ReactFlow
				nodes={nodes}
				edges={edges}
				nodeTypes={nodeTypes}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				fitView
				minZoom={0.5}
				maxZoom={2}
				proOptions={{ hideAttribution: true }}
			>
				<Background color="#cbd5e1" gap={20} size={1} />
				<Controls
					showInteractive={false}
					className="bg-white shadow-md border-none"
				/>
				<MiniMap
					nodeColor={(n) => {
						if (n.data.type === "suspect") return "#dc2626";
						if (n.data.type === "shared") return "#f59e0b";
						return "#94a3b8";
					}}
					className="rounded-lg border shadow-sm"
				/>
			</ReactFlow>

			{network?.nodes.length === 0 && (
				<div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-white/80 backdrop-blur-sm z-50">
					<p>No network connections found.</p>
				</div>
			)}

			<div className="absolute top-4 left-4 bg-white/90 backdrop-blur p-3 rounded-lg border shadow-sm text-xs space-y-2 z-10">
				<div className="font-semibold text-slate-900 mb-1">Entity Map</div>
				<div className="flex items-center gap-2">
					<div className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]"></div>
					<span className="text-slate-600">Suspect</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
					<span className="text-slate-600">Shared Device/IP</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="w-2 h-2 rounded-full bg-slate-500"></div>
					<span className="text-slate-600">Linked Account</span>
				</div>
			</div>
		</div>
	);
}

// Wrap in Provider to use `useReactFlow` hook inside
export default function FraudRingNetwork(props: FraudRingNetworkProps) {
	return (
		<ReactFlowProvider>
			<FraudRingNetworkContent {...props} />
		</ReactFlowProvider>
	);
}
