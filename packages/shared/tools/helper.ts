import type { AgentTool } from "@mariozechner/pi-agent-core";
import type { TSchema } from "@mariozechner/pi-ai";

export function defineTypedTool<TParamSchema extends TSchema>(
  tool: AgentTool<TParamSchema>,
): AgentTool<TParamSchema> {
  return tool;
}
