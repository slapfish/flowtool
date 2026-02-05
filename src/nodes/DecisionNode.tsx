import type { NodeProps, Node } from "@xyflow/react";
import { NodeLabel, StatusSelector, type LabelOnlyData, type NodeStatus } from "./NodeContent";
import { NodeHandles } from "./NodeHandles";

export type DecisionNodeType = Node<LabelOnlyData, "decision">;

// Status colors for diamond (inline styles needed due to SVG)
// These match the Tailwind classes used by other nodes
const DIAMOND_COLORS: Record<NodeStatus, { stroke: string; strokeDark: string; fill: string; fillDark: string }> = {
  new: {
    stroke: "rgba(147, 197, 253, 0.5)",   // blue-300/50
    strokeDark: "rgba(59, 130, 246, 0.3)", // blue-500/30
    fill: "rgba(239, 246, 255, 0.5)",      // blue-50/50
    fillDark: "rgba(23, 37, 84, 0.2)",     // blue-950/20
  },
  implemented: {
    stroke: "rgba(134, 239, 172, 0.5)",    // green-300/50
    strokeDark: "rgba(34, 197, 94, 0.3)",  // green-500/30
    fill: "rgba(240, 253, 244, 0.5)",      // green-50/50
    fillDark: "rgba(5, 46, 22, 0.2)",      // green-950/20
  },
  deprecated: {
    stroke: "rgba(212, 212, 216, 1)",      // zinc-300
    strokeDark: "rgba(82, 82, 91, 1)",     // zinc-600
    fill: "rgba(244, 244, 245, 0.5)",      // zinc-100/50
    fillDark: "rgba(39, 39, 42, 0.5)",     // zinc-800/50
  },
};

export function DecisionNode({ id, data }: NodeProps<DecisionNodeType>) {
  const colors = DIAMOND_COLORS[data.status ?? "new"];
  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  return (
    <div className="group relative w-[220px]">
      <StatusSelector nodeId={id} status={data.status} />
      {/* Diamond shape via SVG */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 220 140" preserveAspectRatio="none">
        <polygon
          points="110,4 216,70 110,136 4,70"
          fill={isDark ? colors.fillDark : colors.fill}
          stroke={isDark ? colors.strokeDark : colors.stroke}
          strokeWidth="1"
        />
      </svg>
      {/* Content container with padding for diamond shape */}
      <div className={`relative px-10 py-8 dark:text-zinc-100 ${data.status === "deprecated" ? "opacity-60" : ""}`}>
        <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide text-center dark:text-zinc-400">
          Decision
        </div>
        <NodeLabel nodeId={id} data={data} className="text-center mt-2" />
      </div>
      <NodeHandles />
    </div>
  );
}
