import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow, useOnViewportChange, type EdgeProps } from "@xyflow/react";
import type { NodeStatus } from "../nodes/NodeContent";
import { STATUS_COLORS } from "../nodes/NodeContent";

const EDGE_COLORS: Record<NodeStatus, string> = {
  new: "#93c5fd",
  implemented: "#86efac",
  deprecated: "#a1a1aa",
};

export interface StatusEdgeData {
  status?: NodeStatus;
}

export function StatusEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  data,
  selected,
}: EdgeProps<StatusEdgeData>) {
  const { setEdges } = useReactFlow();
  const [showSelector, setShowSelector] = useState(false);
  const labelRef = useRef<HTMLDivElement>(null);
  const [selectorPos, setSelectorPos] = useState<{ top: number; left: number } | null>(null);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const status = data?.status ?? "new";
  const strokeColor = EDGE_COLORS[status];
  const statuses: NodeStatus[] = ["new", "implemented", "deprecated"];

  // Unique marker ID for this edge's color
  const markerId = `arrow-${id}`;

  // Update selector position when showing
  useEffect(() => {
    if (showSelector && labelRef.current) {
      const rect = labelRef.current.getBoundingClientRect();
      setSelectorPos({
        top: rect.top - 4,
        left: rect.left + rect.width / 2,
      });
    }
  }, [showSelector]);

  // Close selector on viewport change (pan/zoom)
  useOnViewportChange({
    onChange: useCallback(() => {
      if (showSelector) setShowSelector(false);
    }, [showSelector]),
  });

  // Close selector when clicking outside
  useEffect(() => {
    if (!showSelector) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (labelRef.current && !labelRef.current.contains(e.target as Node)) {
        setShowSelector(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [showSelector]);

  const setStatus = (newStatus: NodeStatus) => {
    setEdges((eds) =>
      eds.map((e) =>
        e.id === id ? { ...e, data: { ...e.data, status: newStatus } } : e
      )
    );
    setShowSelector(false);
  };

  return (
    <>
      {/* Custom arrow marker with status color */}
      <defs>
        <marker
          id={markerId}
          markerWidth="16"
          markerHeight="16"
          viewBox="-10 -10 20 20"
          refX="0"
          refY="0"
          orient="auto-start-reverse"
          markerUnits="strokeWidth"
        >
          <polyline
            points="-5,-4 0,0 -5,4 -5,-4"
            fill={strokeColor}
            stroke={strokeColor}
            strokeWidth="1"
          />
        </marker>
      </defs>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={`url(#${markerId})`}
        style={{
          stroke: strokeColor,
          strokeWidth: selected ? 2 : 1.5,
          opacity: status === "deprecated" ? 0.5 : 0.7,
        }}
      />
      <EdgeLabelRenderer>
        <div
          ref={labelRef}
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
        >
          {/* Clickable label area - minimal style, shows bg on hover/active */}
          <div
            className={`px-1.5 py-0.5 text-[10px] rounded cursor-pointer transition-colors min-w-[16px] min-h-[16px] flex items-center justify-center ${
              showSelector
                ? "bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300"
                : "bg-zinc-900/60 dark:bg-zinc-900/80 text-zinc-300 dark:text-zinc-400 hover:bg-zinc-800 dark:hover:bg-zinc-800 hover:text-zinc-100 dark:hover:text-zinc-200"
            }`}
            onClick={() => setShowSelector(!showSelector)}
            title="Click to change status"
          >
            {label || "·"}
          </div>
        </div>
      </EdgeLabelRenderer>
      {/* Status selector rendered as portal to escape ReactFlow's z-index */}
      {showSelector && selectorPos && createPortal(
        <div
          className="fixed flex gap-1 bg-white dark:bg-zinc-800 rounded shadow-lg border border-zinc-200 dark:border-zinc-600 px-1 py-1"
          style={{
            top: selectorPos.top,
            left: selectorPos.left,
            transform: "translate(-50%, -100%)",
            zIndex: 9999,
          }}
        >
          {statuses.map((s) => (
            <button
              key={s}
              type="button"
              className={`px-2 py-0.5 text-xs rounded cursor-pointer transition-colors whitespace-nowrap ${
                s === status
                  ? "bg-zinc-200 dark:bg-zinc-600 text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
              onClick={() => setStatus(s)}
            >
              {STATUS_COLORS[s].label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
