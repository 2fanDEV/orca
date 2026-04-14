import type { AgentTool } from "@mariozechner/pi-agent-core";

export interface ToolDefinition {
  id: string;
  tool: AgentTool;
}
