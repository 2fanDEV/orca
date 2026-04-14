import type {
  AgentExecutor,
  ExecutionEventBus,
  RequestContext,
} from "@a2a-js/sdk/server";
import type { AgentStatus } from "../../shared/agent/validation";
import { AgentStatus as AgentStatusValues } from "../../shared/agent/validation";
import { UserInputRequiredError } from "../../shared/userInput";
import type { BaseAgent } from "../agent";
import {
  createAgentMessage,
  extractAssistantText,
  extractUserText,
} from "./message";

export class AgentServerExecutor implements AgentExecutor {
  constructor(
    private readonly getSessionAgent: (
      a2aSessionId: string,
    ) => Promise<BaseAgent>,
    private readonly setStatus: (status: AgentStatus) => void,
  ) {}

  async execute(
    requestContext: RequestContext,
    eventBus: ExecutionEventBus,
  ): Promise<void> {
    this.setStatus(AgentStatusValues.BUSY);
    let nextStatus: AgentStatus = AgentStatusValues.IDLE;

    try {
      const userText = extractUserText(requestContext.userMessage.parts);
      if (!userText) {
        eventBus.publish(
          createAgentMessage(
            requestContext,
            "Only text message parts are supported right now.",
          ),
        );
        return;
      }

      const a2aSessionId = requestContext.contextId;
      const agent = await this.getSessionAgent(a2aSessionId);
      await agent.prompt(userText);

      eventBus.publish(
        createAgentMessage(
          requestContext,
          extractAssistantText(agent.get_state_message()),
        ),
      );
    } catch (error) {
      if (error instanceof UserInputRequiredError) {
        nextStatus = AgentStatusValues.AWAITING_USER_INPUT;
        eventBus.publish(createAgentMessage(requestContext, error.message));
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "The agent failed to handle the request.";
      eventBus.publish(createAgentMessage(requestContext, message));
    } finally {
      this.setStatus(nextStatus);
      eventBus.finished();
    }
  }

  async cancelTask(
    _taskId: string,
    _eventBus: ExecutionEventBus,
  ): Promise<void> {
    // Required by the A2A executor contract. This server only produces
    // synchronous responses, so there is no long-running task to cancel.
  }
}
