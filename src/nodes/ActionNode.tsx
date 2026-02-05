import { useState, useCallback, useRef, useEffect } from "react";
import type { NodeProps, Node } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";
import { NodeHandles } from "./NodeHandles";
import { StatusSelector, getStatusClasses, type NodeStatus } from "./NodeContent";
import { useSubModules } from "../SubModuleContext";

interface ActionNodeData {
  description: string;
  subModuleId?: string | null;
  status?: NodeStatus;
}

export type ActionNodeType = Node<ActionNodeData, "action">;

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
        if (e.key === "Escape") onCancel();
      }}
    />
  );
}

/** Render description with simple formatting (bullet lists) */
function FormattedDescription({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
      {lines.map((line, i) => {
        const bullet = line.match(/^(\s*)[-*]\s+(.*)$/);
        if (bullet) {
          return (
            <div key={i} className="flex items-start gap-1.5">
              <span style={{ marginLeft: bullet[1].length * 8 }}>•</span>
              <span>{bullet[2]}</span>
            </div>
          );
        }
        return <div key={i}>{line || "\u00A0"}</div>;
      })}
    </div>
  );
}

export function ActionNode({ id, data }: NodeProps<ActionNodeType>) {
  const { updateNodeData } = useReactFlow();
  const subModules = useSubModules();
  const [picking, setPicking] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.description ?? "");

  const commit = useCallback(() => {
    updateNodeData(id, { description: draft });
    setEditing(false);
  }, [draft, id, updateNodeData]);

  const linked = data.subModuleId
    ? subModules.find((sm) => sm.id === data.subModuleId)
    : null;

  return (
    <div className={`group relative rounded-none border px-5 py-3 shadow-sm w-[240px] dark:text-zinc-100 ${getStatusClasses(data.status)}`}>
      <StatusSelector nodeId={id} status={data.status} />
      <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide dark:text-zinc-400">
        Action
      </div>

      {/* Description */}
      <div className="mt-2">
        {editing ? (
          <AutoTextarea
            value={draft}
            onChange={setDraft}
            onCommit={commit}
            onCancel={() => { setDraft(data.description ?? ""); setEditing(false); }}
            className="text-sm border-b border-zinc-300 dark:border-zinc-600"
          />
        ) : (
          <div
            className="cursor-text min-h-[1.5rem]"
            onDoubleClick={() => { setDraft(data.description ?? ""); setEditing(true); }}
          >
            {data.description ? (
              <FormattedDescription text={data.description} />
            ) : (
              <span className="text-sm text-zinc-400 dark:text-zinc-500">double-click to edit</span>
            )}
          </div>
        )}
      </div>

      {/* Sub-module link */}
      <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-600">
        {picking ? (
          <select
            autoFocus
            className="nodrag w-full text-xs bg-transparent border border-zinc-300 rounded px-1.5 py-1 outline-none dark:border-zinc-600 dark:text-zinc-100"
            value={data.subModuleId ?? ""}
            onChange={(e) => {
              updateNodeData(id, { subModuleId: e.target.value || null });
              setPicking(false);
            }}
            onBlur={() => setPicking(false)}
          >
            <option value="">none</option>
            {subModules.map((sm) => (
              <option key={sm.id} value={sm.id}>
                {sm.moduleLabel} &rsaquo; {sm.label}
              </option>
            ))}
          </select>
        ) : linked ? (
          <div
            className="nodrag flex items-start gap-2 cursor-pointer"
            onClick={() => setPicking(true)}
          >
            <div
              className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${
                linked.status === "implemented" ? "bg-green-400" :
                linked.status === "deprecated" ? "bg-zinc-400" : "bg-blue-400"
              }`}
            />
            <div className="text-xs leading-relaxed">
              <div className="text-zinc-400 dark:text-zinc-500">{linked.moduleLabel}</div>
              <div className="text-zinc-700 dark:text-zinc-300">{linked.label}</div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="nodrag text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer dark:text-zinc-500 dark:hover:text-zinc-300"
            onClick={() => setPicking(true)}
          >
            + link module
          </button>
        )}
      </div>

      <NodeHandles />
    </div>
  );
}
