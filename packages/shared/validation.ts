import { z } from "zod";
import type { AgentCard } from "@a2a-js/sdk";

export const AgentStatus = {
  REGISTERED: "Registered",
  IDLE: "Idle",
  BUSY: "Busy",
  AWAITING_USER_INPUT: "Awaiting User Input",
  STALE: "Stale",
} as const;

const AgentStatusSchema = z.enum(
  Object.values(AgentStatus) as [string, ...string[]],
);

export const AgentCardSchema: z.ZodType<AgentCard> = z.looseObject({
  name: z.string(),
  url: z.url(),
  capabilities: z.any(),
  defaultInputModes: z.array(z.string()),
  defaultOutputModes: z.array(z.string()),
  description: z.string(),
  skills: z.array(z.any()),
  preferredTransport: z.optional(z.string()),
  provider: z.optional(z.any()),
  protocolVersion: z.string(),
  version: z.string(),
});

export const AgentEntrySchema = z.object({
  card: AgentCardSchema,
  location: z.url(),
  status: AgentStatusSchema,
  lastSeen: z.number(),
  tags: z.record(z.string(), z.string()),
});

export const RegisteringAgentEntrySchema = z.object({
  card: AgentCardSchema,
  location: z.url(),
  tags: z.record(z.string(), z.string()),
});

export const AgentHeartbeatSchema = z.object({
  status: AgentStatusSchema,
});

export type AgentStatus = z.infer<typeof AgentStatusSchema>;
export type AgentEntry = z.infer<typeof AgentEntrySchema>;
export type RegisteringAgentEntry = z.infer<typeof RegisteringAgentEntrySchema>;
export type AgentHeartbeat = z.infer<typeof AgentHeartbeatSchema>;
