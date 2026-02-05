import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MarkerType,
  useReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from "@xyflow/react";
import type {
  Node,
  Edge,
  DefaultEdgeOptions,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
} from "@xyflow/react";
import { invoke } from "@tauri-apps/api/core";
import { nodeTypes } from "./nodes";
import { edgeTypes } from "./edges";
import { Sidebar } from "./Sidebar";
import { SubModuleContext } from "./SubModuleContext";
import type { ModuleNodeData } from "./nodes/ModuleNode";
import { syncSubModuleCounter } from "./nodes/ModuleNode";

// Node dimensions for layout (approximate)
const NODE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  situation: { width: 240, height: 100 },
  action: { width: 240, height: 140 },
  decision: { width: 220, height: 140 },
  end: { width: 200, height: 100 },
  module: { width: 340, height: 250 },
};

// Detect flow direction from edge handles
function detectFlowDirection(edges: Edge[]): "vertical" | "horizontal" {
  let verticalCount = 0;
  let horizontalCount = 0;

  edges.forEach((e) => {
    const source = e.sourceHandle ?? "";
    const target = e.targetHandle ?? "";
    // bottom->top or top->bottom = vertical flow
    if (source === "bottom" || source === "top" || target === "top" || target === "bottom") {
      verticalCount++;
    }
    // left->right or right->left = horizontal flow
    if (source === "left" || source === "right" || target === "left" || target === "right") {
      horizontalCount++;
    }
  });

  return horizontalCount > verticalCount ? "horizontal" : "vertical";
}

// Simple topological layout - arranges nodes in layers based on edge flow
function getLayoutedNodes(nodes: Node[], edges: Edge[]) {
  if (nodes.length === 0) return nodes;

  const direction = detectFlowDirection(edges);
  const isHorizontal = direction === "horizontal";

  // Build adjacency info
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  nodes.forEach((n) => {
    outgoing.set(n.id, []);
    incoming.set(n.id, []);
  });
  edges.forEach((e) => {
    outgoing.get(e.source)?.push(e.target);
    incoming.get(e.target)?.push(e.source);
  });

  // Find root nodes (no incoming edges)
  const roots = nodes.filter((n) => incoming.get(n.id)?.length === 0);

  // Assign layers via BFS
  const layer = new Map<string, number>();
  const queue = roots.map((n) => n.id);
  roots.forEach((n) => layer.set(n.id, 0));

  while (queue.length > 0) {
    const id = queue.shift()!;
    const currentLayer = layer.get(id) ?? 0;
    for (const targetId of outgoing.get(id) ?? []) {
      const existingLayer = layer.get(targetId);
      if (existingLayer === undefined || existingLayer < currentLayer + 1) {
        layer.set(targetId, currentLayer + 1);
        queue.push(targetId);
      }
    }
  }

  // Nodes without edges get layer 0
  nodes.forEach((n) => {
    if (!layer.has(n.id)) layer.set(n.id, 0);
  });

  // Group by layer
  const layers: Node[][] = [];
  nodes.forEach((n) => {
    const l = layer.get(n.id) ?? 0;
    if (!layers[l]) layers[l] = [];
    layers[l].push(n);
  });

  // Position nodes
  const GAP = 100;
  let primary = 0; // x for horizontal, y for vertical

  const positioned = new Map<string, { x: number; y: number }>();

  layers.forEach((layerNodes) => {
    let maxPrimary = 0;
    let totalSecondary = 0;

    layerNodes.forEach((n) => {
      const dims = NODE_DIMENSIONS[n.type ?? "situation"] ?? { width: 240, height: 100 };
      const primarySize = isHorizontal ? dims.width : dims.height;
      const secondarySize = isHorizontal ? dims.height : dims.width;
      totalSecondary += secondarySize + GAP;
      maxPrimary = Math.max(maxPrimary, primarySize);
    });
    totalSecondary -= GAP;

    let secondary = -totalSecondary / 2;
    layerNodes.forEach((n) => {
      const dims = NODE_DIMENSIONS[n.type ?? "situation"] ?? { width: 240, height: 100 };
      const secondarySize = isHorizontal ? dims.height : dims.width;

      if (isHorizontal) {
        positioned.set(n.id, { x: primary, y: secondary });
      } else {
        positioned.set(n.id, { x: secondary, y: primary });
      }
      secondary += secondarySize + GAP;
    });

    primary += maxPrimary + GAP;
  });

  return nodes.map((n) => ({
    ...n,
    position: positioned.get(n.id) ?? n.position,
  }));
}

export type View = "process" | "modules";

const defaultEdgeOptions: DefaultEdgeOptions = {
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
};

let nodeId = 0;
function nextId() {
  return `node-${++nodeId}`;
}

interface FlowData {
  process: { nodes: Node[]; edges: Edge[] };
  modules: { nodes: Node[] };
}

function parseFlowData(raw: string): FlowData {
  const data = JSON.parse(raw);
  // Backwards compat: old format was { nodes, edges }
  if ("nodes" in data && !("process" in data)) {
    return {
      process: { nodes: data.nodes ?? [], edges: data.edges ?? [] },
      modules: { nodes: [] },
    };
  }
  return {
    process: { nodes: data.process?.nodes ?? [], edges: data.process?.edges ?? [] },
    modules: { nodes: data.modules?.nodes ?? [] },
  };
}

function syncNodeIdCounter(flowData: FlowData) {
  const allNodes = [...flowData.process.nodes, ...flowData.modules.nodes];
  const maxId = allNodes.reduce((max, n) => {
    const num = parseInt(n.id.replace("node-", ""), 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
  nodeId = maxId;
}

const defaultNewData: Record<string, Record<string, unknown>> = {
  situation: { label: "New situation" },
  action: { description: "" },
  decision: { label: "New decision" },
  end: { label: "End" },
  module: { label: "New module", description: "", submodules: [] },
};

function Flow() {
  const [view, setView] = useState<View>("process");
  const [processNodes, setProcessNodes] = useState<Node[]>([]);
  const [processEdges, setProcessEdges] = useState<Edge[]>([]);
  const [moduleNodes, setModuleNodes] = useState<Node[]>([]);
  const [flowList, setFlowList] = useState<string[]>([]);
  const [currentFlow, setCurrentFlow] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { screenToFlowPosition } = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const skipSave = useRef(false);

  // Extract unique categories from modules
  const moduleCategories = useMemo(() => {
    const cats = new Set<string>();
    moduleNodes.forEach((n) => {
      const cat = (n.data as ModuleNodeData).category;
      if (cat) cats.add(cat);
    });
    return Array.from(cats).sort();
  }, [moduleNodes]);

  // Filter modules by active category (null = show all)
  const filteredModuleNodes = useMemo(() => {
    if (activeCategory === null) return moduleNodes;
    return moduleNodes.filter((n) => (n.data as ModuleNodeData).category === activeCategory);
  }, [moduleNodes, activeCategory]);

  // Active nodes/edges based on view
  const nodes = view === "process" ? processNodes : filteredModuleNodes;
  const edges = view === "process" ? processEdges : [];
  const setNodes = view === "process" ? setProcessNodes : setModuleNodes;

  // Sub-modules list for action node picker — extracted from module node data, with parent info
  const subModules = useMemo(
    () => moduleNodes.flatMap((n) => {
      const data = n.data as ModuleNodeData;
      return (data.submodules ?? []).map((sm) => ({
        ...sm,
        moduleId: n.id,
        moduleLabel: data.label,
      }));
    }),
    [moduleNodes],
  );

  // Load flow list on mount
  useEffect(() => {
    invoke<string[]>("list_flows").then(setFlowList).catch(() => {});
  }, []);

  // Auto-save with debounce
  useEffect(() => {
    if (!currentFlow || skipSave.current) {
      skipSave.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const data: FlowData = {
        process: { nodes: processNodes, edges: processEdges },
        modules: { nodes: moduleNodes },
      };
      invoke("write_flow", { name: currentFlow, data: JSON.stringify(data) }).catch(() => {});
    }, 500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [processNodes, processEdges, moduleNodes, currentFlow]);

  const refreshList = useCallback(async () => {
    const list = await invoke<string[]>("list_flows").catch(() => []);
    setFlowList(list);
  }, []);

  const loadFlow = useCallback(async (name: string) => {
    try {
      const raw = await invoke<string>("read_flow", { name });
      const data = parseFlowData(raw);
      skipSave.current = true;
      setProcessNodes(data.process.nodes);
      skipSave.current = true;
      setProcessEdges(data.process.edges);
      skipSave.current = true;
      setModuleNodes(data.modules.nodes);
      setCurrentFlow(name);
      syncNodeIdCounter(data);
      syncSubModuleCounter(data.modules.nodes);
    } catch {
      // File might not exist or be corrupt
    }
  }, []);

  const createFlow = useCallback(async (name: string) => {
    const data: FlowData = {
      process: { nodes: [], edges: [] },
      modules: { nodes: [] },
    };
    await invoke("write_flow", { name, data: JSON.stringify(data) }).catch(() => {});
    skipSave.current = true;
    setProcessNodes([]);
    skipSave.current = true;
    setProcessEdges([]);
    skipSave.current = true;
    setModuleNodes([]);
    setCurrentFlow(name);
    nodeId = 0;
    await refreshList();
  }, [refreshList]);

  const deleteFlow = useCallback(async (name: string) => {
    await invoke("delete_flow", { name }).catch(() => {});
    if (currentFlow === name) {
      skipSave.current = true;
      setProcessNodes([]);
      skipSave.current = true;
      setProcessEdges([]);
      skipSave.current = true;
      setModuleNodes([]);
      setCurrentFlow(null);
      nodeId = 0;
    }
    await refreshList();
  }, [currentFlow, refreshList]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes],
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setProcessEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );

  const onConnect: OnConnect = useCallback(
    (connection) => setProcessEdges((eds) => addEdge(connection, eds)),
    [],
  );

  const onConnectStart = useCallback(() => {
    wrapperRef.current?.classList.add("connecting");
  }, []);

  const onConnectEnd = useCallback(() => {
    wrapperRef.current?.classList.remove("connecting");
  }, []);

  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      setProcessEdges((eds) => eds.filter((e) => e.id !== edge.id));
    },
    [],
  );

  const onEdgeDoubleClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      const label = prompt("Edge label:", (edge.label as string) ?? "");
      if (label === null) return;
      setProcessEdges((eds) =>
        eds.map((e) => (e.id === edge.id ? { ...e, label: label || undefined } : e))
      );
    },
    [],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData("application/reactflow");
      if (!type) return;

      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      const newNode: Node = {
        id: nextId(),
        type,
        position,
        data: defaultNewData[type] ?? { label: type },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [screenToFlowPosition, setNodes],
  );

  const onLayout = useCallback(() => {
    if (view === "process") {
      const layoutedNodes = getLayoutedNodes(processNodes, processEdges);
      setProcessNodes(layoutedNodes);
    } else {
      // For modules, arrange in a grid
      const cols = 3;
      const GAP_X = 400;
      const GAP_Y = 320;
      const layoutedNodes = moduleNodes.map((node, i) => ({
        ...node,
        position: {
          x: (i % cols) * GAP_X,
          y: Math.floor(i / cols) * GAP_Y,
        },
      }));
      setModuleNodes(layoutedNodes);
    }
  }, [view, processNodes, processEdges, moduleNodes]);

  const isProcess = view === "process";

  return (
    <SubModuleContext.Provider value={subModules}>
    <div className="flex h-screen w-screen">
      <Sidebar
        flowList={flowList}
        currentFlow={currentFlow}
        onSelectFlow={loadFlow}
        onCreateFlow={createFlow}
        onDeleteFlow={deleteFlow}
        view={view}
        onViewChange={setView}
        subModules={subModules}
      />
      <div className="flex-1 flex flex-col" ref={wrapperRef}>
        {/* View toggle */}
        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
          <button
            type="button"
            className={`px-3 py-1 text-xs font-medium rounded cursor-pointer transition-colors ${
              isProcess
                ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
            onClick={() => setView("process")}
          >
            Process
          </button>
          <button
            type="button"
            className={`px-3 py-1 text-xs font-medium rounded cursor-pointer transition-colors ${
              !isProcess
                ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
            onClick={() => setView("modules")}
          >
            Modules
          </button>

          {/* Category tabs (modules view only) */}
          {!isProcess && moduleCategories.length > 0 && (
            <>
              <div className="w-px h-4 bg-zinc-300 mx-2 dark:bg-zinc-600" />
              <button
                type="button"
                className={`px-2 py-1 text-xs rounded cursor-pointer transition-colors ${
                  activeCategory === null
                    ? "bg-zinc-300 text-zinc-800 dark:bg-zinc-600 dark:text-zinc-200"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
                onClick={() => setActiveCategory(null)}
              >
                All
              </button>
              {moduleCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`px-2 py-1 text-xs rounded cursor-pointer transition-colors ${
                    activeCategory === cat
                      ? "bg-zinc-300 text-zinc-800 dark:bg-zinc-600 dark:text-zinc-200"
                      : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </>
          )}

          {/* Layout button */}
          <div className="ml-auto">
            <button
              type="button"
              className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-700 rounded cursor-pointer transition-colors dark:text-zinc-400 dark:hover:text-zinc-200"
              onClick={onLayout}
              title="Auto-arrange nodes"
            >
              Arrange
            </button>
          </div>
        </div>
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={isProcess ? onEdgesChange : undefined}
            onConnect={isProcess ? onConnect : undefined}
            onConnectStart={isProcess ? onConnectStart : undefined}
            onConnectEnd={isProcess ? onConnectEnd : undefined}
            onEdgeContextMenu={isProcess ? onEdgeContextMenu : undefined}
            onEdgeDoubleClick={isProcess ? onEdgeDoubleClick : undefined}
            defaultEdgeOptions={isProcess ? defaultEdgeOptions : undefined}
            edgesReconnectable={false}
            onDragOver={onDragOver}
            onDrop={onDrop}
            snapToGrid
            snapGrid={[20, 20]}
            deleteKeyCode="Delete"
            colorMode="system"
            fitView
          >
            <Background gap={20} variant="cross" size={1} color="var(--grid-color, #e4e4e7)" />
            <Controls />
          </ReactFlow>
        </div>
      </div>
    </div>
    </SubModuleContext.Provider>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}
