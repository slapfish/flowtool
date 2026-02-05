import type { NodeProps, Node } from "@xyflow/react";
import { NodeLabel, StatusSelector, getStatusClasses, type LabelOnlyData } from "./NodeContent";
import { NodeHandles } from "./NodeHandles";

export type SituationNodeType = Node<LabelOnlyData, "situation">;

export function SituationNode({ id, data }: NodeProps<SituationNodeType>) {
  return (
    <div className={`group relative rounded-xl border px-5 py-3 shadow-sm w-[240px] dark:text-zinc-100 ${getStatusClasses(data.status)}`}>
      <StatusSelector nodeId={id} status={data.status} />
      <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide dark:text-zinc-400">
        Situation
      </div>
      <NodeLabel nodeId={id} data={data} className="mt-2" />
      <NodeHandles />
    </div>
  );
}
