import { createContext, useContext } from "react";
import type { SubModule } from "./nodes/ModuleNode";

export interface SubModuleWithParent extends SubModule {
  moduleId: string;
  moduleLabel: string;
}

export const SubModuleContext = createContext<SubModuleWithParent[]>([]);

export function useSubModules() {
  return useContext(SubModuleContext);
}

/** Generate a deterministic color from a string (for module icons) */
export function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 45%)`;
}
