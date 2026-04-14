import invariant from "tiny-invariant";
import {
  AgentHeartbeatSchema,
  AgentEntrySchema,
  AgentStatus,
  RegisteringAgentEntrySchema,
  type AgentHeartbeat,
  type AgentEntry,
  type RegisteringAgentEntry,
} from "../shared/agent/validation";
import { AgentToolRegistry } from "./toolRegistry";
import type { ToolSpec } from "../shared/agent/tool";

export interface AgentRegistryOptions {
  staleTimeoutMs?: number;
}

export class AgentRegistry {
  private agentEntries: Map<string, AgentEntry> = new Map();
  private toolRegistry = new AgentToolRegistry<ToolSpec>();

  private readonly staleTimeouts = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();

  constructor(private readonly options: AgentRegistryOptions = {}) {}

  addAgent(agentId: string, agentEntry: AgentEntry) {
    invariant(
      AgentEntrySchema.safeParse(agentEntry).success,
      "The AgentEntry could not be parsed successfully",
    );
    this.agentEntries.set(agentId, agentEntry);
  }

  removeAgent(agentId: string) {
    this.agentEntries.delete(agentId);
    this.clearStaleTimeout(agentId);
  }

  getAgent(agentId: string): AgentEntry | undefined {
    return this.agentEntries.get(agentId);
  }

  listAgents() {
    return Array.from(this.agentEntries.entries(), ([agentId, entry]) => ({
      agentId,
      ...entry,
      location: entry.location.toString(),
    }));
  }

  registerAgent(agentId: string, agentEntry: RegisteringAgentEntry) {
    if (this.agentEntries.has(agentId)) {
      return false;
    }

    this.addAgent(agentId, {
      card: agentEntry.card,
      location: agentEntry.location,
      status: AgentStatus.REGISTERED,
      lastSeen: Date.now(),
      tools: agentEntry.tools,
      tags: agentEntry.tags,
    });
    this.scheduleStaleTimeout(agentId);
    return true;
  }

  heartbeatAgent(agentId: string, heartbeat: AgentHeartbeat) {
    const existingAgent = this.agentEntries.get(agentId);
    if (!existingAgent) {
      return undefined;
    }

    const updatedAgent: AgentEntry = {
      ...existingAgent,
      status: heartbeat.status,
      lastSeen: Date.now(),
    };
    this.agentEntries.set(agentId, updatedAgent);
    this.scheduleStaleTimeout(agentId);
    return updatedAgent;
  }

  dispose() {
    for (const agentId of this.staleTimeouts.keys()) {
      this.clearStaleTimeout(agentId);
    }
  }

  run(): void {
    console.log("Server starting..");
    Bun.serve({
      routes: {
        "/agents": {
          GET: () => {
            return Response.json(this.listAgents());
          },
        },
        //
        "/agents/:id": {
          GET: (req) => {
            const agentId = req.params.id;
            const agentEntry = this.getAgent(agentId);
            if (agentEntry === undefined) {
              return new Response(
                `The agent ${agentId} is not in the registry`,
                {
                  status: 404,
                },
              );
            }
            return Response.json(agentEntry);
          },
          POST: async (req) => {
            const agentId = req.params.id;
            const body = await req.json();
            const parsed = AgentHeartbeatSchema.safeParse(body);

            if (!parsed.success) {
              return Response.json(parsed.error.format(), { status: 400 });
            }

            const agentEntry = this.heartbeatAgent(agentId, parsed.data);
            if (!agentEntry) {
              return new Response(
                `The agent ${agentId} is not in the registry`,
                {
                  status: 404,
                },
              );
            }

            return new Response(`Heartbeat for agent ${agentId} received.`);
          },
        },
        //
        "/agents/register/:id": {
          POST: async (req) => {
            const agentId = req.params.id;
            const body = await req.json();
            const parsed = RegisteringAgentEntrySchema.safeParse(body);

            if (!parsed.success) {
              return Response.json(parsed.error.format(), { status: 400 });
            }

            const registeringAgentEntry: RegisteringAgentEntry = parsed.data;
            if (!this.registerAgent(agentId, registeringAgentEntry)) {
              return new Response(
                `Agent with id: ${agentId} is already registered.`,
                { status: 409 },
              );
            }

            return new Response(
              `Agent ${agentId} has successfully registered itself.`,
            );
          },
        },
        //
        "/agents/:agentId/tools/:toolId": {
          POST: (req) => {
            const agentId = req.params.agentId;
            const toolId = req.params.toolId;
            const agent = this.getAgent(agentId);
            if (agent === undefined) {
              return new Response(`Agent with ${agentId} isn't registered.`, {
                status: 404,
              });
            }
            const path = `${agent.location}/tools/add/${toolId}`;
            if (this.toolRegistry.getTool(toolId)) {
              return new Response(
                `Tool with the id ${toolId} is no registered with the toolRegistry.`,
              );
            }
            const tool = agent.tools.find((tool) => tool.id === toolId);
            if (tool) {
              return new Response(
                `Tool with id ${toolId} is already registered for agent ${agentId}.`,
                { status: 409 },
              );
            }

            fetch(path, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(tool),
            });

            return new Response(
              `Tool with ${toolId} is registered for agent ${agentId}.`,
            );
          },
          DELETE: (req) => {
            return new Response("Okidoki");
          },
        },
        "/tools": {
          GET: (req) => {
            return new Response("");
          },
          POST: (req) => {
            return new Response("");
          },
        },
      },
    });
  }

  private scheduleStaleTimeout(agentId: string) {
    this.clearStaleTimeout(agentId);
    this.staleTimeouts.set(
      agentId,
      setTimeout(() => {
        const agentEntry = this.agentEntries.get(agentId);
        if (!agentEntry) {
          this.clearStaleTimeout(agentId);
          return;
        }

        this.agentEntries.set(agentId, {
          ...agentEntry,
          status: AgentStatus.STALE,
        });
        this.clearStaleTimeout(agentId);
      }, this.options.staleTimeoutMs ?? 60_000),
    );
  }

  private clearStaleTimeout(agentId: string) {
    const timeout = this.staleTimeouts.get(agentId);
    if (!timeout) {
      return;
    }

    clearTimeout(timeout);
    this.staleTimeouts.delete(agentId);
  }
}
