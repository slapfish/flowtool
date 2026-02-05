import { useState, useCallback, useRef, useEffect } from "react";
import { useReactFlow } from "@xyflow/react";

export type NodeStatus = "new" | "implemented" | "deprecated";

export const STATUS_COLORS: Record<NodeStatus, { border: string; bg: string; label: string }> = {
  new: {
    border: "border-blue-300/50 dark:border-blue-500/30",
    bg: "bg-blue-50/50 dark:bg-blue-950/20",
    label: "New"
  },
  implemented: {
    border: "border-green-300/50 dark:border-green-500/30",
    bg: "bg-green-50/50 dark:bg-green-950/20",
    label: "Implemented"
  },
  deprecated: {
    border: "border-zinc-300 dark:border-zinc-600",
    bg: "bg-zinc-100/50 dark:bg-zinc-800/50 opacity-60",
    label: "Deprecated"
  },
};

export interface LabelOnlyData {
  label: string;
  status?: NodeStatus;
}

function AutoTextarea({
  value,
  onChange,
  onCommit,
  onCancel,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  onCommit: () => void;
  onCancel: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
      ref.current.select();
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, []);

  return (
    <textarea
      ref={ref}
      rows={1}
      className={`nodrag nowheel w-full bg-transparent outline-none resize-none overflow-hidden ${className ?? ""}`}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
        e.target.style.height = "auto";
        e.target.style.height = e.target.scrollHeight + "px";
      }}
      onBlur={onCommit}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onCommit();
        }
        if (e.key === "Escape") onCancel();
      }}
    />
  );
}

/** Floating status selector - shows on hover */
export function StatusSelector({ nodeId, status }: { nodeId: string; status?: NodeStatus }) {
  const { updateNodeData } = useReactFlow();
  const statuses: NodeStatus[] = ["new", "implemented", "deprecated"];
  const current = status ?? "new";

  return (
    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
      <div className="flex gap-1 bg-white dark:bg-zinc-800 rounded shadow-lg border border-zinc-200 dark:border-zinc-600 px-1 py-1">
        {statuses.map((s) => (
          <button
            key={s}
            type="button"
            className={`nodrag px-2 py-0.5 text-xs rounded cursor-pointer transition-colors ${
              s === current
                ? "bg-zinc-200 dark:bg-zinc-600 text-zinc-900 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
            onClick={() => updateNodeData(nodeId, { status: s })}
          >
            {STATUS_COLORS[s].label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Get border + bg classes for node status */
export function getStatusClasses(status?: NodeStatus): string {
  const s = STATUS_COLORS[status ?? "new"];
  return `${s.border} ${s.bg}`;
}

/** Label-only content for Situation, Decision, End nodes */
export function NodeLabel({ nodeId, data, className }: { nodeId: string; data: LabelOnlyData; className?: string }) {
  const { updateNodeData } = useReactFlow();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.label);

  const commit = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed) {
      updateNodeData(nodeId, { label: trimmed });
    } else {
      setDraft(data.label);
    }
    setEditing(false);
  }, [draft, data.label, nodeId, updateNodeData]);

  return editing ? (
    <AutoTextarea
      value={draft}
      onChange={setDraft}
      onCommit={commit}
      onCancel={() => { setDraft(data.label); setEditing(false); }}
      className={`text-sm font-medium leading-relaxed border-b border-zinc-400 dark:border-zinc-500 ${className ?? ""}`}
    />
  ) : (
    <div
      className={`text-sm font-medium leading-relaxed cursor-text ${className ?? ""}`}
      onDoubleClick={() => { setDraft(data.label); setEditing(true); }}
    >
      {data.label}
    </div>
  );
}
