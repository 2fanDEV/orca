import { AGENT_CARD_PATH, type AgentCard } from "@a2a-js/sdk";
import { DefaultRequestHandler, InMemoryTaskStore } from "@a2a-js/sdk/server";
import {
  UserBuilder,
  agentCardHandler,
  jsonRpcHandler,
  restHandler,
} from "@a2a-js/sdk/server/express";
import express from "express";
import type { AgentStatus } from "../shared/validation";
import { AgentStatus as AgentStatusValues } from "../shared/validation";
import { createAgentCard } from "./server/agentCard";
import { AgentServerExecutor } from "./server/executor";
import { registerAgent } from "./server/registry";
import { AgentSessionStore } from "./server/sessionStore";
import type {
  AgentServerConfig,
  AgentServerOptions,
  DefaultAgentServer,
} from "./server/types";

interface HttpServer {
  close(callback: (error?: Error) => void): void;
}

export class AgentServer implements DefaultAgentServer {
  readonly agentCard: AgentCard;
  readonly config: AgentServerConfig;
  agentStatus: AgentStatus = AgentStatusValues.IDLE;

  private readonly app = express();
  private readonly sessionStore;
  private server?: HttpServer;

  constructor(options: AgentServerOptions) {
    this.config = options.config;
    this.agentCard = createAgentCard(options.config.publicBaseUrl, options.card);
    this.sessionStore = new AgentSessionStore(options.sessionFactory);

    const executor = new AgentServerExecutor(
      (a2aSessionId) => this.sessionStore.get(a2aSessionId),
      (status) => {
        this.agentStatus = status;
      },
    );

    const requestHandler = new DefaultRequestHandler(
      this.agentCard,
      new InMemoryTaskStore(),
      executor,
    );

    this.app.use(
      `/${AGENT_CARD_PATH}`,
      agentCardHandler({ agentCardProvider: requestHandler }),
    );
    this.app.use(
      "/a2a/jsonrpc",
      jsonRpcHandler({
        requestHandler,
        userBuilder: UserBuilder.noAuthentication,
      }),
    );
    this.app.use(
      "/a2a/rest",
      restHandler({
        requestHandler,
        userBuilder: UserBuilder.noAuthentication,
      }),
    );
  }

  async start(): Promise<void> {
    if (this.server) {
      return;
    }

    await new Promise<void>((resolve) => {
      this.server = this.app.listen(this.config.port, () => resolve());
    });

    try {
      await registerAgent(this.config, this.agentCard);
    } catch (error) {
      await this.stop();
      throw error;
    }

    this.agentStatus = AgentStatusValues.IDLE;
  }

  async stop(): Promise<void> {
    const activeServer = this.server;
    this.server = undefined;
    this.sessionStore.clear();

    if (!activeServer) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      activeServer.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}

export type {
  AgentCardConfig,
  AgentServerConfig,
  AgentServerOptions,
  AgentSessionFactory,
  AgentSkillConfig,
  DefaultAgentServer,
} from "./server/types";
