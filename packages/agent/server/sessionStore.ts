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
}
