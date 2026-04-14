import type { AgentTool } from "@mariozechner/pi-agent-core";
import { isToolDefinition, type Tool } from "../shared/agent/tool";

export interface ToolRegistry<T extends Tool> {
  agentTools: Map<string, T>;
  addTool: (tool: T) => void;
  getTool: (id: string) => T | undefined;
  removeTool: (id: string) => void;
  listTools: () => T[];
  toAgentTools: () => AgentTool[];
}

export class AgentToolRegistry<T extends Tool> implements ToolRegistry<T> {
  agentTools: Map<string, T>;

  constructor() {
    this.agentTools = new Map<string, T>();
  }

  addTool = (tool: T) => {
    this.agentTools.set(tool.id, tool);
  };

  getTool = (id: string) => {
    return this.agentTools.get(id);
  };

  removeTool = (id: string) => {
    this.agentTools.delete(id);
  };

  listTools = () => {
    return this.agentTools.values().toArray();
  };

  toAgentTools = () => {
    return this.agentTools
      .values()
      .map((tool) => {
        if (isToolDefinition(tool)) return tool.tool;
        throw new Error(
          `ToolSpec ${tool.id} is not convertable into AgentTool!`,
        );
      })
      .toArray();
  };
}
