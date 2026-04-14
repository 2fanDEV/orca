import { Agent } from "@mariozechner/pi-agent-core";
import type { Model } from "@mariozechner/pi-ai";
import type { Provider } from "../provider/provider";
import {
  AgentToolRegistry,
  type ToolRegistry,
} from "../registryServer/toolRegistry";
import type { ToolDefinition } from "../shared/agent/tool";
import { fileExists, readTextFile } from "../shared/runtime";

enum ThinkingState {
  DEFAULT = "off",
  OFF = "off",
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  XHIGH = "xhigh",
}

export class BaseAgent {
  private agent: Agent;
  provider: Provider;
  name: string;
  toolRegistry: ToolRegistry;

  constructor(
    name: string,
    agent: Agent,
    provider: Provider,
    toolRegistry: ToolRegistry,
  ) {
    this.name = name;
    this.agent = agent;
    this.provider = provider;
    this.toolRegistry = toolRegistry;
  }

  static async create(
    name: string,
    provider: Provider,
    model: Model<any>,
    tools: ToolDefinition[],
    systemPrompt?: string,
    thinkingState?: ThinkingState,
    sessionId?: string,
  ) {
    const defaultSystemPrompt =
      systemPrompt ?? (await loadDefaultSystemPrompt());

    const toolRegistry = new AgentToolRegistry();
    tools.forEach((tool) => {
      toolRegistry.addTool(tool);
    });

    const agent = new Agent({
      initialState: {
        model,
        systemPrompt: defaultSystemPrompt,
        thinking: thinkingState ?? ThinkingState.DEFAULT,
        tools: toolRegistry.toAgentTools(),
      },
      sessionId,
    });

    return new BaseAgent(name, agent, provider, toolRegistry);
  }

  async prompt(prompt: string) {
    return this.agent.prompt(prompt);
  }

  addTool(tool: ToolDefinition) {
    if (this.toolRegistry.getTool(tool.id)) {
      return false;
    }

    this.toolRegistry.addTool(tool);
    this.agent.state.tools = this.toolRegistry.toAgentTools();
    return true;
  }

  get_state_message() {
    return this.agent.state.messages;
  }

  get_system_prompt() {
    return this.agent.state.systemPrompt;
  }
}

async function loadDefaultSystemPrompt() {
  const defaultPromptFile = new URL(
    "./defaults/default_base_agent.md",
    import.meta.url,
  );

  if (!(await fileExists(defaultPromptFile))) {
    throw new Error("Missing default system prompt file");
  }

  return readTextFile(defaultPromptFile);
}
