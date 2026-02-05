import { SituationNode } from "./SituationNode";
import { ActionNode } from "./ActionNode";
import { DecisionNode } from "./DecisionNode";
import { EndNode } from "./EndNode";
import { ModuleNode } from "./ModuleNode";

export const nodeTypes = {
  situation: SituationNode,
  action: ActionNode,
  decision: DecisionNode,
  end: EndNode,
  module: ModuleNode,
};
