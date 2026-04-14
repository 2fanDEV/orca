import type { AgentTool } from "@mariozechner/pi-agent-core";
import type { ToolDefinition } from "../shared/agent/tool";

export interface ToolRegistry {
  agentTools: Map<string, ToolDefinition>;
  addTool: (tool: ToolDefinition) => void;
  getTool: (id: string) => ToolDefinition | undefined;
  removeTool: (id: string) => void;
  listTools: () => ToolDefinition[];
  toAgentTools: () => AgentTool[];
}

export class AgentToolRegistry implements ToolRegistry {
  agentTools: Map<string, ToolDefinition>;

  constructor() {
    this.agentTools = new Map<string, ToolDefinition>();
  }

  addTool = (tool: ToolDefinition) => {
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
        return tool.tool;
      })
      .toArray();
  };
}
