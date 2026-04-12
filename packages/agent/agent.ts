import { Agent, type AgentTool } from "@mariozechner/pi-agent-core";
import type { Model } from "@mariozechner/pi-ai";
import type { Provider } from "../provider/provider";

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

  constructor(name: string, agent: Agent, provider: Provider) {
    this.name = name;
    this.agent = agent;
    this.provider = provider;
  }

  static async create(
    name: string,
    provider: Provider,
    model: Model<any>,
    tools: AgentTool[],
    systemPrompt?: string,
    thinkingState?: ThinkingState,
    sessionId?: string,
  ) {
    const defaultSystemPrompt =
      systemPrompt ?? (await loadDefaultSystemPrompt());

    const agent = new Agent({
      initialState: {
        model,
        systemPrompt: defaultSystemPrompt,
        thinking: thinkingState ?? ThinkingState.DEFAULT,
        tools,
      },
      sessionId,
    });

    return new BaseAgent(name, agent, provider);
  }

  async prompt(prompt: string) {
    return this.agent.prompt(prompt);
  }

  get_state_message() {
    return this.agent.state.messages;
  }

  get_system_prompt() {
    return this.agent.state.systemPrompt;
  }
}

async function loadDefaultSystemPrompt() {
  const defaultPromptFile = Bun.file(
    new URL("./defaults/default_base_agent.md", import.meta.url),
  );

  if (!(await defaultPromptFile.exists())) {
    throw new Error("Missing default system prompt file");
  }

  return defaultPromptFile.text();
}
