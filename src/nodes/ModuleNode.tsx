import { useState, useCallback, useRef, useEffect } from "react";
import type { NodeProps, Node } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";
import { hashColor } from "../SubModuleContext";
import { getStatusClasses, STATUS_COLORS, type NodeStatus } from "./NodeContent";

export interface SubModule {
  id: string;
  label: string;
  description: string;
  steps: string[];
  status?: NodeStatus;
}

export interface ModuleNodeData {
  label: string;
  description: string;
  category?: string;
  status?: NodeStatus;
  submodules: SubModule[];
}

export type ModuleNodeType = Node<ModuleNodeData, "module">;

let subModuleCounter = 0;
function nextSubModuleId() {
  return `sm-${++subModuleCounter}`;
}

export function syncSubModuleCounter(modules: Node[]) {
  const max = modules.reduce((m, n) => {
    const data = n.data as ModuleNodeData;
    return (data.submodules ?? []).reduce((acc, sm) => {
      const num = parseInt(sm.id.replace("sm-", ""), 10);
      return isNaN(num) ? acc : Math.max(acc, num);
    }, m);
  }, 0);
  subModuleCounter = max;
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

const STATUS_DOT_COLORS: Record<NodeStatus, string> = {
  new: "bg-blue-400",
  implemented: "bg-green-400",
  deprecated: "bg-zinc-400",
};

function SubModuleCard({
  sm,
  moduleId,
  onUpdate,
  onDelete,
}: {
  sm: SubModule;
  moduleId: string;
  onUpdate: (updated: SubModule) => void;
  onDelete: () => void;
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(sm.label);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState(sm.description);
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [stepDraft, setStepDraft] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  const status = sm.status ?? "new";
  const statuses: NodeStatus[] = ["new", "implemented", "deprecated"];

  return (
    <div className="group/sm relative rounded border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-600 dark:bg-zinc-800">
      {/* Hover status selector */}
      <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover/sm:opacity-100 transition-opacity z-10">
        <div className="flex gap-1 bg-white dark:bg-zinc-800 rounded shadow-lg border border-zinc-200 dark:border-zinc-600 px-1 py-1">
          {statuses.map((s) => (
            <button
              key={s}
              type="button"
              className={`nodrag px-2 py-0.5 text-xs rounded cursor-pointer transition-colors ${
                s === status
                  ? "bg-zinc-200 dark:bg-zinc-600 text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
              onClick={() => onUpdate({ ...sm, status: s })}
            >
              {STATUS_COLORS[s].label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <div
            className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${STATUS_DOT_COLORS[status]}`}
          />
          <button
            type="button"
            className="nodrag text-xs text-zinc-400 cursor-pointer shrink-0 mt-0.5 dark:text-zinc-500"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? "+" : "−"}
          </button>
          {editingTitle ? (
            <AutoTextarea
              value={titleDraft}
              onChange={setTitleDraft}
              onCommit={() => {
                const trimmed = titleDraft.trim();
                if (trimmed) onUpdate({ ...sm, label: trimmed });
                else setTitleDraft(sm.label);
                setEditingTitle(false);
              }}
              onCancel={() => { setTitleDraft(sm.label); setEditingTitle(false); }}
              className="text-sm font-medium leading-relaxed border-b border-zinc-400 dark:border-zinc-500"
            />
          ) : (
            <div
              className="text-sm font-medium leading-relaxed cursor-text"
              onDoubleClick={() => { setTitleDraft(sm.label); setEditingTitle(true); }}
            >
              {sm.label}
            </div>
          )}
        </div>
        <button
          type="button"
          className="nodrag text-xs text-zinc-400 hover:text-red-500 cursor-pointer shrink-0 dark:text-zinc-500 dark:hover:text-red-400"
          onClick={onDelete}
        >
          x
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Description */}
          {editingDesc ? (
            <AutoTextarea
              value={descDraft}
              onChange={setDescDraft}
              onCommit={() => {
                onUpdate({ ...sm, description: descDraft.trim() });
                setEditingDesc(false);
              }}
              onCancel={() => { setDescDraft(sm.description); setEditingDesc(false); }}
              className="nodrag text-xs mt-2 text-zinc-500 leading-relaxed border-b border-zinc-300 dark:border-zinc-600 dark:text-zinc-400"
            />
          ) : (
            <div
              className="text-xs mt-2 text-zinc-500 leading-relaxed cursor-text dark:text-zinc-400"
              onDoubleClick={() => { setDescDraft(sm.description); setEditingDesc(true); }}
            >
              {sm.description || "double-click to describe"}
            </div>
          )}

          {/* Steps */}
          {sm.steps.length > 0 && (
            <div className="mt-3 border-t border-zinc-100 pt-2 flex flex-col gap-1 dark:border-zinc-700">
              {sm.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-xs text-zinc-400 mt-0.5 tabular-nums shrink-0 dark:text-zinc-500 select-none">
                    {i + 1}.
                  </span>
                  {editingStep === i ? (
                    <AutoTextarea
                      value={stepDraft}
                      onChange={setStepDraft}
                      onCommit={() => {
                        const trimmed = stepDraft.trim();
                        const steps = [...sm.steps];
                        if (trimmed) steps[i] = trimmed;
                        else steps.splice(i, 1);
                        onUpdate({ ...sm, steps });
                        setEditingStep(null);
                      }}
                      onCancel={() => {
                        if (!step) {
                          const steps = [...sm.steps];
                          steps.splice(i, 1);
                          onUpdate({ ...sm, steps });
                        }
                        setEditingStep(null);
                      }}
                      className="text-xs leading-relaxed border-b border-zinc-300 dark:border-zinc-600"
                    />
                  ) : (
                    <div
                      className="text-xs text-zinc-600 leading-relaxed cursor-text dark:text-zinc-400"
                      onDoubleClick={() => { setStepDraft(step); setEditingStep(i); }}
                    >
                      {step}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            className="nodrag mt-2 text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer dark:text-zinc-500 dark:hover:text-zinc-300"
            onClick={() => {
              const steps = [...sm.steps, ""];
              onUpdate({ ...sm, steps });
              setStepDraft("");
              setEditingStep(steps.length - 1);
            }}
          >
            + step
          </button>
        </>
      )}
    </div>
  );
}

export function ModuleNode({ id, data }: NodeProps<ModuleNodeType>) {
  const { updateNodeData } = useReactFlow();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(data.label);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState(data.description ?? "");

  const submodules = data.submodules ?? [];

  const commitTitle = useCallback(() => {
    const trimmed = titleDraft.trim();
    if (trimmed) updateNodeData(id, { label: trimmed });
    else setTitleDraft(data.label);
    setEditingTitle(false);
  }, [titleDraft, data.label, id, updateNodeData]);

  const commitDesc = useCallback(() => {
    updateNodeData(id, { description: descDraft.trim() });
    setEditingDesc(false);
  }, [descDraft, id, updateNodeData]);

  const addSubModule = useCallback(() => {
    const sm: SubModule = {
      id: nextSubModuleId(),
      label: "New sub-module",
      description: "",
      steps: [],
    };
    updateNodeData(id, { submodules: [...submodules, sm] });
  }, [submodules, id, updateNodeData]);

  const updateSubModule = useCallback((index: number, updated: SubModule) => {
    const next = [...submodules];
    next[index] = updated;
    updateNodeData(id, { submodules: next });
  }, [submodules, id, updateNodeData]);

  const deleteSubModule = useCallback((index: number) => {
    const next = [...submodules];
    next.splice(index, 1);
    updateNodeData(id, { submodules: next });
  }, [submodules, id, updateNodeData]);

  const [editingCategory, setEditingCategory] = useState(false);
  const [categoryDraft, setCategoryDraft] = useState(data.category ?? "");

  const commitCategory = useCallback(() => {
    updateNodeData(id, { category: categoryDraft.trim() || undefined });
    setEditingCategory(false);
  }, [categoryDraft, id, updateNodeData]);

  // Compute module status from submodules (unless manually deprecated)
  const computedStatus: NodeStatus = data.status === "deprecated"
    ? "deprecated"
    : submodules.length === 0
      ? "new"
      : submodules.every((sm) => sm.status === "implemented")
        ? "implemented"
        : "new";

  const isDeprecated = data.status === "deprecated";

  return (
    <div className={`group relative rounded border px-5 py-4 shadow-sm w-[340px] dark:text-zinc-100 ${getStatusClasses(computedStatus)}`}>
      {/* Deprecated toggle on hover */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          type="button"
          className={`nodrag px-3 py-1 text-xs rounded shadow-lg border cursor-pointer transition-colors ${
            isDeprecated
              ? "bg-zinc-200 dark:bg-zinc-600 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-500"
              : "bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-200"
          }`}
          onClick={() => updateNodeData(id, { status: isDeprecated ? undefined : "deprecated" })}
        >
          {isDeprecated ? "Deprecated ✓" : "Mark Deprecated"}
        </button>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full shrink-0 ${STATUS_DOT_COLORS[computedStatus]}`}
          />
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wide dark:text-zinc-500">
            Module
          </div>
        </div>
        {/* Category badge */}
        {editingCategory ? (
          <input
            autoFocus
            className="nodrag text-xs bg-transparent border-b border-zinc-400 outline-none w-24 dark:border-zinc-500"
            value={categoryDraft}
            onChange={(e) => setCategoryDraft(e.target.value)}
            onBlur={commitCategory}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitCategory();
              if (e.key === "Escape") { setCategoryDraft(data.category ?? ""); setEditingCategory(false); }
            }}
            placeholder="category"
          />
        ) : data.category ? (
          <div
            className="text-xs px-2 py-0.5 rounded bg-zinc-200 text-zinc-600 cursor-pointer dark:bg-zinc-700 dark:text-zinc-400"
            onDoubleClick={() => { setCategoryDraft(data.category ?? ""); setEditingCategory(true); }}
          >
            {data.category}
          </div>
        ) : (
          <button
            type="button"
            className="nodrag text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer dark:text-zinc-500 dark:hover:text-zinc-300"
            onClick={() => { setCategoryDraft(""); setEditingCategory(true); }}
          >
            + category
          </button>
        )}
      </div>

      {/* Title */}
      {editingTitle ? (
        <AutoTextarea
          value={titleDraft}
          onChange={setTitleDraft}
          onCommit={commitTitle}
          onCancel={() => { setTitleDraft(data.label); setEditingTitle(false); }}
          className="text-base mt-3 font-semibold leading-relaxed border-b border-zinc-400 dark:border-zinc-500"
        />
      ) : (
        <div
          className="text-base mt-3 font-semibold leading-relaxed cursor-text"
          onDoubleClick={() => { setTitleDraft(data.label); setEditingTitle(true); }}
        >
          {data.label}
        </div>
      )}

      {/* Description */}
      {editingDesc ? (
        <AutoTextarea
          value={descDraft}
          onChange={setDescDraft}
          onCommit={commitDesc}
          onCancel={() => { setDescDraft(data.description ?? ""); setEditingDesc(false); }}
          className="text-sm mt-2 text-zinc-500 leading-relaxed border-b border-zinc-300 dark:border-zinc-600 dark:text-zinc-400"
        />
      ) : (
        <div
          className="text-sm mt-2 text-zinc-500 leading-relaxed cursor-text dark:text-zinc-400"
          onDoubleClick={() => { setDescDraft(data.description ?? ""); setEditingDesc(true); }}
        >
          {data.description || "double-click to describe"}
        </div>
      )}

      {/* Sub-modules */}
      {submodules.length > 0 && (
        <div className="mt-4 border-t border-zinc-200 pt-4 flex flex-col gap-2 dark:border-zinc-700">
          {submodules.map((sm, i) => (
            <SubModuleCard
              key={sm.id}
              sm={sm}
              moduleId={id}
              onUpdate={(updated) => updateSubModule(i, updated)}
              onDelete={() => deleteSubModule(i)}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        className="nodrag mt-3 text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer dark:text-zinc-500 dark:hover:text-zinc-300"
        onClick={addSubModule}
      >
        + sub-module
      </button>
    </div>
  );
}
