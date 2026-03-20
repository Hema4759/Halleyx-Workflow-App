// types/workflow.ts
export interface ActionNode {
  id: string;
  type: "send" | "receive";
  content: string;
}

export interface Workflow {
  id: string;
  name: string;
  actions: ActionNode[];
}