import { useState } from "react";
import type { View } from "./App";
import type { SubModuleWithParent } from "./SubModuleContext";

const processToolbox: { type: string; label: string; silhouette: string }[] = [
  { type: "situation", label: "Situation", silhouette: "rounded-lg" },
  { type: "action", label: "Action", silhouette: "rounded-none" },
  { type: "decision", label: "Decision", silhouette: "rotate-45 rounded-sm" },
  { type: "end", label: "End", silhouette: "rounded-full border-2" },
];

const moduleToolbox: { type: string; label: string }[] = [
  { type: "module", label: "Module" },
];

function onDragStart(e: React.DragEvent, nodeType: string) {
  e.dataTransfer.setData("application/reactflow", nodeType);
  e.dataTransfer.effectAllowed = "move";
}

interface SidebarProps {
  flowList: string[];
  currentFlow: string | null;
  onSelectFlow: (name: string) => void;
  onCreateFlow: (name: string) => void;
  onDeleteFlow: (name: string) => void;
  view: View;
  onViewChange: (view: View) => void;
  subModules: SubModuleWithParent[];
}

export function Sidebar({ flowList, currentFlow, onSelectFlow, onCreateFlow, onDeleteFlow, view }: SidebarProps) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const handleCreate = () => {
    const name = newName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
    if (!name) return;
    onCreateFlow(name);
    setNewName("");
    setCreating(false);
  };

  return (
    <aside className="w-52 shrink-0 border-r border-zinc-200 bg-zinc-50 flex flex-col dark:border-zinc-700 dark:bg-zinc-900">
      {/* Flows section */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Flows
          </div>
          <button
            type="button"
            className="text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer dark:text-zinc-500 dark:hover:text-zinc-300"
            onClick={() => setCreating(true)}
          >
            + new
          </button>
        </div>

        {creating && (
          <form
            className="mb-2"
            onSubmit={(e) => { e.preventDefault(); handleCreate(); }}
          >
            <input
              autoFocus
              className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-sm outline-none focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-400"
              placeholder="flow name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={() => { if (!newName.trim()) setCreating(false); }}
              onKeyDown={(e) => { if (e.key === "Escape") { setCreating(false); setNewName(""); } }}
            />
          </form>
        )}

        <div className="flex flex-col gap-0.5">
          {flowList.map((name) => (
            <div
              key={name}
              className={`group flex items-center justify-between rounded px-2 py-1 text-sm cursor-pointer ${
                name === currentFlow
                  ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
              onClick={() => onSelectFlow(name)}
            >
              <span className="truncate">{name}</span>
              <button
                type="button"
                className="hidden group-hover:block text-zinc-400 hover:text-red-500 cursor-pointer text-xs dark:text-zinc-500 dark:hover:text-red-400"
                onClick={(e) => { e.stopPropagation(); onDeleteFlow(name); }}
              >
                x
              </button>
            </div>
          ))}
          {flowList.length === 0 && !creating && (
            <div className="text-xs text-zinc-400 dark:text-zinc-500">No flows yet</div>
          )}
        </div>
      </div>

      {/* Toolbox section */}
      <div className="p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-3 dark:text-zinc-400">
          Toolbox
        </div>
        <div className="flex flex-col gap-2">
          {view === "process"
            ? processToolbox.map((item) => (
                <div
                  key={item.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, item.type)}
                  className="flex items-center gap-2 rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 cursor-grab active:cursor-grabbing hover:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-500"
                >
                  <div className={`w-3 h-3 border border-current ${item.silhouette}`} />
                  {item.label}
                </div>
              ))
            : moduleToolbox.map((item) => (
                <div
                  key={item.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, item.type)}
                  className="flex items-center gap-2 rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 cursor-grab active:cursor-grabbing hover:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-500"
                >
                  {item.label}
                </div>
              ))}
        </div>
      </div>
    </aside>
  );
}
