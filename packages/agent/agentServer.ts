import type { AgentCard } from "@a2a-js/sdk";
import type { AgentStatus } from "../shared/validation";
import type { BaseAgent } from "./agent";

export interface AgentServer {
  readonly agentCard: AgentCard;
  agentStatus: AgentStatus;
  agent: BaseAgent;
}
