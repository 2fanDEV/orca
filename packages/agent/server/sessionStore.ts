import type { BaseAgent } from "../agent";
import type { AgentSessionFactory } from "./types";

export class AgentSessionStore {
  private readonly sessions = new Map<string, Promise<BaseAgent>>();

  constructor(private readonly sessionFactory: AgentSessionFactory) {}

  get(a2aSessionId: string) {
    const existingSession = this.sessions.get(a2aSessionId);
    if (existingSession) {
      return existingSession;
    }

    const createdSession = this.sessionFactory.create(a2aSessionId).catch((error) => {
      this.sessions.delete(a2aSessionId);
      throw error;
    });
    this.sessions.set(a2aSessionId, createdSession);
    return createdSession;
  }

  clear() {
    this.sessions.clear();
  }

  async forEach(
    visit: (agent: BaseAgent, a2aSessionId: string) => Promise<void> | void,
  ) {
    await Promise.all(
      Array.from(this.sessions.entries(), async ([a2aSessionId, agentPromise]) => {
        await visit(await agentPromise, a2aSessionId);
      }),
    );
  }
}
