import type { NodeProps, Node } from "@xyflow/react";
import { NodeLabel, StatusSelector, getStatusClasses, type LabelOnlyData } from "./NodeContent";
import { NodeHandles } from "./NodeHandles";

export type EndNodeType = Node<LabelOnlyData, "end">;

export function EndNode({ id, data }: NodeProps<EndNodeType>) {
  return (
    <div className={`group relative rounded-full border px-8 py-4 shadow-sm w-[200px] dark:text-zinc-100 ${getStatusClasses(data.status)}`}>
      <StatusSelector nodeId={id} status={data.status} />
      <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide text-center dark:text-zinc-400">
        End
      </div>
      <NodeLabel nodeId={id} data={data} className="text-center mt-1" />
      <NodeHandles />
    </div>
  );
}
