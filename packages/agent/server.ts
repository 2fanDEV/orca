import { AGENT_CARD_PATH, type AgentCard } from "@a2a-js/sdk";
import { DefaultRequestHandler, InMemoryTaskStore } from "@a2a-js/sdk/server";
import {
  agentCardHandler,
  jsonRpcHandler,
  restHandler,
  UserBuilder,
} from "@a2a-js/sdk/server/express";
import express from "express";
import { AgentToolRegistry } from "../registryServer/toolRegistry";
import type { ToolDefinition } from "../shared/agent/tool";
import type { AgentStatus } from "../shared/agent/validation";
import { AgentStatus as AgentStatusValues } from "../shared/agent/validation";
import { createAgentCard } from "./server/agentCard";
import { AgentServerExecutor } from "./server/executor";
import { heartbeatAgent, registerAgent } from "./server/registry";
import { AgentSessionStore } from "./server/sessionStore";
import { createToolRegistrationHandler } from "./server/toolHandler";
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
  private readonly toolRegistry = new AgentToolRegistry();
  private readonly sessionStore;
  private heartbeatTimer?: ReturnType<typeof setInterval>;
  private server?: HttpServer;

  constructor(options: AgentServerOptions) {
    this.config = options.config;
    this.agentCard = createAgentCard(
      options.config.publicBaseUrl,
      options.card,
    );
    this.sessionStore = new AgentSessionStore({
      create: async (a2aSessionId) => {
        const agent = await options.sessionFactory.create(a2aSessionId);
        this.toolRegistry.listTools().forEach((tool) => {
          agent.addTool(tool);
        });
        return agent;
      },
    });

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
    this.app.post(
      "/tools/add/:toolId",
      express.json(),
      createToolRegistrationHandler((tool) => this.registerTool(tool)),
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
      this.agentStatus = AgentStatusValues.IDLE;
      await heartbeatAgent(this.config, this.agentStatus);
      this.heartbeatTimer = setInterval(() => {
        void heartbeatAgent(this.config, this.agentStatus).catch((error) => {
          console.error(
            `Failed to heartbeat agent ${this.config.agentId}:`,
            error,
          );
        });
      }, this.config.heartbeatIntervalMs);
    } catch (error) {
      await this.stop();
      throw error;
    }

    this.agentStatus = AgentStatusValues.IDLE;
  }

  async stop(): Promise<void> {
    const activeServer = this.server;
    this.server = undefined;
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
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

  private async registerTool(tool: ToolDefinition) {
    if (this.toolRegistry.getTool(tool.id)) {
      return false;
    }

    this.toolRegistry.addTool(tool);
    await this.sessionStore.forEach((agent) => {
      agent.addTool(tool);
    });
    return true;
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
