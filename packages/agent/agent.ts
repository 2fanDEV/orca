import type { AgentTool } from "@mariozechner/pi-agent-core";
import { Agent } from "@mariozechner/pi-agent-core";
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
  agent: Agent;
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
    const defaultSystemPrompt = await Bun.file(
      "./defaults/default_base_agent.md",
    ).text();
    const agent = new Agent({
      initialState: {
        model,
        systemPrompt: systemPrompt ?? defaultSystemPrompt,
        thinking: thinkingState ?? ThinkingState.DEFAULT,
        tools,
      },
      sessionId,
    });

    return new BaseAgent(name, agent, provider);
  }
}
