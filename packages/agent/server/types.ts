import type { AgentCard } from "@a2a-js/sdk";
import type { AgentStatus } from "../../shared/validation";
import type { BaseAgent } from "../agent";

export interface AgentServerConfig {
  agentId: string;
  port: number;
  publicBaseUrl: string;
  registryBaseUrl: string;
  heartbeatIntervalMs: number;
  tags: Record<string, string>;
}

export interface AgentSessionFactory {
  create(a2aSessionId: string): Promise<BaseAgent>;
}

export interface AgentSkillConfig {
  id: string;
  name: string;
  description: string;
  tags: string[];
}

export interface AgentCardConfig {
  name: string;
  description: string;
  version: string;
  skills: AgentSkillConfig[];
  defaultInputModes?: string[];
  defaultOutputModes?: string[];
}

export interface AgentServerOptions {
  config: AgentServerConfig;
  card: AgentCardConfig;
  sessionFactory: AgentSessionFactory;
}

export interface DefaultAgentServer {
  readonly agentCard: AgentCard;
  agentStatus: AgentStatus;
  readonly config: AgentServerConfig;

  start(): Promise<void>;
  stop(): Promise<void>;
}
