import invariant from "tiny-invariant";
import {
  AgentHeartbeatSchema,
  AgentEntrySchema,
  AgentStatus,
  RegisteringAgentEntrySchema,
  type AgentHeartbeat,
  type AgentEntry,
  type RegisteringAgentEntry,
} from "../shared/validation";

export interface AgentRegistryOptions {
  staleTimeoutMs?: number;
}

export class AgentRegistry {
  private readonly agentEntries: Map<string, AgentEntry> = new Map();
  private readonly staleTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

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

  getAgent(agentId: string) {
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
        "/": {
          GET: () => {
            return Response.json(this.listAgents());
          },
        },
        //
        "/:id": {
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
              return new Response(`The agent ${agentId} is not in the registry`, {
                status: 404,
              });
            }

            return new Response(`Heartbeat for agent ${agentId} received.`);
          },
        },
        //
        "/register/:id": {
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
