import type { Message, Part } from "@a2a-js/sdk";
import type { RequestContext } from "@a2a-js/sdk/server";
import type { AgentMessage } from "@mariozechner/pi-agent-core";

export function extractUserText(parts: Part[]) {
  const textParts = parts
    .filter((part): part is Extract<Part, { kind: "text" }> => part.kind === "text")
    .map((part) => part.text.trim())
    .filter(Boolean);

  return textParts.join("\n\n");
}

export function extractAssistantText(messages: AgentMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== "assistant") {
      continue;
    }

    const text = message.content
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("");

    if (text) {
      return text;
    }
  }

  return "The agent completed the request but did not return any text output.";
}

export function createAgentMessage(
  requestContext: RequestContext,
  text: string,
): Message {
  return {
    kind: "message",
    messageId: crypto.randomUUID(),
    role: "agent",
    contextId: requestContext.contextId,
    taskId: requestContext.taskId,
    parts: [
      {
        kind: "text",
        text,
      },
    ],
  };
}
