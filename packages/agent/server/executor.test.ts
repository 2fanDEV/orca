import { expect, test } from "bun:test";
import { RequestContext, type ExecutionEventBus } from "@a2a-js/sdk/server";
import { AgentStatus } from "../../shared/agent/validation";
import { UserInputRequiredError } from "../../shared/userInput";
import type { BaseAgent } from "../agent";
import { AgentServerExecutor } from "./executor";

test("execute publishes the assistant response and returns to idle", async () => {
  const statuses: string[] = [];
  const eventBus = new TestExecutionEventBus();
  const executor = new AgentServerExecutor(
    async () => createAgent(),
    (status) => {
      statuses.push(status);
    },
  );

  await executor.execute(createRequestContext("Hello"), eventBus);

  expect(statuses).toEqual([AgentStatus.BUSY, AgentStatus.IDLE]);
  expect(eventBus.finishedCalled).toBe(true);
  expect(eventBus.messages).toHaveLength(1);
  expect(eventBus.messages[0]?.parts[0]).toMatchObject({
    kind: "text",
    text: "Assistant reply",
  });
});

test("execute marks the agent as awaiting user input when manual input is required", async () => {
  const statuses: string[] = [];
  const eventBus = new TestExecutionEventBus();
  const executor = new AgentServerExecutor(
    async () =>
      createAgent({
        prompt: async () => {
          throw new UserInputRequiredError({
            message: "Enter the verification code.",
            placeholder: "123456",
          });
        },
      }),
    (status) => {
      statuses.push(status);
    },
  );

  await executor.execute(createRequestContext("Continue"), eventBus);

  expect(statuses).toEqual([AgentStatus.BUSY, AgentStatus.AWAITING_USER_INPUT]);
  expect(eventBus.finishedCalled).toBe(true);
  expect(eventBus.messages).toHaveLength(1);
  expect(eventBus.messages[0]?.parts[0]).toMatchObject({
    kind: "text",
    text: "Enter the verification code.\nSuggested input: 123456",
  });
});

function createRequestContext(text: string) {
  return new RequestContext(
    {
      kind: "message",
      messageId: "user-message-1",
      role: "user",
      parts: [
        {
          kind: "text",
          text,
        },
      ],
    },
    "task-1",
    "context-1",
  );
}

function createAgent(options?: {
  prompt?: (prompt: string) => Promise<void>;
  messages?: Array<{
    role: string;
    content: Array<{
      type: string;
      text: string;
    }>;
  }>;
}) {
  return {
    prompt: options?.prompt ?? (async () => {}),
    get_state_message: () =>
      options?.messages ?? [
        {
          role: "assistant",
          content: [
            {
              type: "text",
              text: "Assistant reply",
            },
          ],
        },
      ],
  } as unknown as BaseAgent;
}

class TestExecutionEventBus implements ExecutionEventBus {
  readonly messages: any[] = [];
  finishedCalled = false;

  publish(event: any) {
    this.messages.push(event);
  }

  on(_eventName: "event" | "finished", _listener: (event: any) => void) {
    return this;
  }

  off(_eventName: "event" | "finished", _listener: (event: any) => void) {
    return this;
  }

  once(_eventName: "event" | "finished", _listener: (event: any) => void) {
    return this;
  }

  removeAllListeners(_eventName?: "event" | "finished") {
    return this;
  }

  finished() {
    this.finishedCalled = true;
  }
}
