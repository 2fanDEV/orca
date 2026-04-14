import type { AgentTool } from "@mariozechner/pi-agent-core";

export interface Tool {
  id: string;
}

export interface ToolSpec extends Tool {
  name: string;
  description: string;
}

export interface ToolDefinition extends Tool {
  tool: AgentTool<any>;
}

export function isToolDefinition(tool: Tool): tool is ToolDefinition {
  return "tool" in tool;
}

export function is<T extends Tool>(tool: T): tool is T {
  return "tool" in tool;
}
