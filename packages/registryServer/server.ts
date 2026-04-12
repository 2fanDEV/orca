import invariant from "tiny-invariant";
import {
  AgentEntrySchema,
  AgentStatus,
  RegisteringAgentEntrySchema,
  type AgentEntry,
  type RegisteringAgentEntry,
} from "../shared/validation";

export class AgentRegistry {
  private agentEntries: Map<string, AgentEntry> = new Map();

  addAgent(agentId: string, agentEntry: AgentEntry) {
    invariant(
      AgentEntrySchema.safeParse(agentEntry).success,
      "The AgentEntry could not be parsed successfully",
    );
    this.agentEntries.set(agentId, agentEntry);
  }

  removeAgent(agentId: string) {
    this.agentEntries.delete(agentId);
  }

  run(): void {
    console.log("Server starting..");
    Bun.serve({
      routes: {
        "/": {
          GET: () => {
            return Response.json(
              Array.from(this.agentEntries.entries(), ([agentId, entry]) => ({
                agentId,
                ...entry,
                location: entry.location.toString(),
              })),
            );
          },
        },
        //
        "/:id": {
          GET: (req) => {
            const agentId = req.params.id;
            const agentEntry: AgentEntry | undefined =
              this.agentEntries.get(agentId);
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
          POST: (req) => {
            const agentId = req.params.id;
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

            if (this.agentEntries.has(agentId)) {
              return new Response(
                `Agent with id: ${agentId} is already registered.`,
                { status: 409 },
              );
            }

            const registeringAgentEntry: RegisteringAgentEntry = parsed.data;
            this.addAgent(agentId, {
              card: registeringAgentEntry.card,
              location: registeringAgentEntry.location,
              status: AgentStatus.REGISTERED,
              lastSeen: Date.now(),
              tags: registeringAgentEntry.tags,
            });
            return new Response(
              `Agent ${agentId} has successfully registered itself.`,
            );
          },
        },
      },
    });
  }
}

new AgentRegistry().run();
