"use client";

import { useEffect, useMemo } from "react";
import dagre from "dagre";
import {
	ReactFlow,
	Background,
	Controls,
	MiniMap,
	useNodesState,
	useEdgesState,
	MarkerType,
	Handle,
	Position,
	type Node,
	type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const nodeWidth = 120;
const nodeHeight = 90;

interface FraudRingNetworkProps {
	alertId: Id<"alerts">;
}

type FraudNodeData = {
	label: string;
	type: "suspect" | "shared" | "mule";
};

type GraphNode = Node<FraudNodeData>;
type GraphEdge = Edge;

function layoutGraph(nodes: GraphNode[], edges: GraphEdge[]) {
	const g = new dagre.graphlib.Graph();
	g.setDefaultEdgeLabel(() => ({}));
	g.setGraph({
		rankdir: "TB", // top -> bottom
		nodesep: 80,
		ranksep: 120,
		marginx: 20,
		marginy: 20,
	});

	nodes.forEach((n) => {
		g.setNode(n.id, { width: nodeWidth, height: nodeHeight });
	});

	edges.forEach((e) => {
		g.setEdge(e.source, e.target);
	});

	dagre.layout(g);

	return nodes.map((n) => {
		const pos = g.node(n.id);
		return {
			...n,
			position: {
				x: pos.x - nodeWidth / 2,
				y: pos.y - nodeHeight / 2,
			},
			sourcePosition: Position.Bottom,
			targetPosition: Position.Top,
		};
	});
}

const FraudNode = ({ data }: { data: FraudNodeData }) => {
	const isSuspect = data.type === "suspect";
	const isShared = data.type === "shared";

	const bgColor = isSuspect
		? "bg-red-600"
		: isShared
			? "bg-yellow-500"
			: "bg-gray-400";

	return (
		<div className="relative flex flex-col items-center">
			<Handle type="target" position={Position.Top} />

			<div
				className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${bgColor} bg-opacity-90 border-2 border-white`}
			>
				{data.label.substring(0, 1)}
			</div>

			<div className="mt-2 text-xs font-bold text-gray-600 bg-white px-2 py-0.5 rounded shadow-sm border">
				{data.label}
			</div>

			<Handle type="source" position={Position.Bottom} />
		</div>
	);
};

const nodeTypes = { fraudNode: FraudNode };

export default function FraudRingNetwork({ alertId }: FraudRingNetworkProps) {
	const network = useQuery(api.cases.getFraudRingNetworkByAlertId, {
		alertId,
	});

	console.log(network, "<<network");

	const layouted = useMemo(() => {
		if (!network) return null;
		const nodes: GraphNode[] = network.nodes.map((node) => ({
			id: node.id,
			type: "fraudNode",
			data: {
				label: node.label,
				type: node.type,
			},
			position: { x: 0, y: 0 },
		}));
		const edges: GraphEdge[] = network.edges.map((edge) => ({
			...edge,
			type: "smoothstep",
			animated: true,
			style: { stroke: "#c73e3a", strokeWidth: 1.6 },
			markerEnd: { type: MarkerType.ArrowClosed, color: "#c73e3a" },
		}));

		return { nodes: layoutGraph(nodes, edges), edges };
	}, [network]);

	const [nodes, setNodes, onNodesChange] = useNodesState<GraphNode>([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState<GraphEdge>([]);

	useEffect(() => {
		if (!layouted) return;
		setNodes(layouted.nodes);
		setEdges(layouted.edges);
	}, [layouted, setNodes, setEdges]);

	return (
		<div className="w-full h-140 bg-slate-50 border rounded-xl overflow-hidden relative">
			<ReactFlow
				nodes={nodes}
				edges={edges}
				nodeTypes={nodeTypes}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				fitView
				nodesDraggable={false}
				nodesConnectable={false}
				elementsSelectable={false}
				defaultEdgeOptions={{
					type: "smoothstep",
					animated: true,
				}}
			>
				<Background gap={12} size={1} />
				<Controls />
				<MiniMap pannable zoomable />
			</ReactFlow>

			{network === null && (
				<div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground bg-white/70">
					No linked entities found for this alert.
				</div>
			)}

			<GraphLegend />
		</div>
	);
}

function GraphLegend() {
	return (
		<div className="absolute top-4 right-4 bg-white/90 p-3 rounded-lg border shadow text-xs">
			<div className="flex items-center gap-2 mb-1">
				<div className="w-3 h-3 rounded-full bg-red-600"></div> Suspect
			</div>
			<div className="flex items-center gap-2 mb-1">
				<div className="w-3 h-3 rounded-full bg-yellow-500"></div> Shared Infra
			</div>
			<div className="flex items-center gap-2">
				<div className="w-3 h-3 rounded-full bg-gray-400"></div> Mule
			</div>
		</div>
	);
}
