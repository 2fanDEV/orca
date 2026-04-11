import { expect, test } from "bun:test";
import type { Model } from "@mariozechner/pi-ai";
import { BaseAgent } from "./agent";
import { OAuthProvider } from "../provider/provider";

const TEST_MODEL = {
  id: "test-model",
  name: "Test Model",
  api: "openai-responses",
  provider: "openai",
  baseUrl: "https://api.openai.com/v1",
  reasoning: false,
  input: ["text"],
  cost: {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
  },
  contextWindow: 1024,
  maxTokens: 256,
} as Model<any>;

test("BaseAgent.create loads the default system prompt file", async () => {
  const defaultPrompt = await Bun.file(
    new URL("./defaults/default_base_agent.md", import.meta.url),
  ).text();

  const baseAgent = await BaseAgent.create(
    "test-agent",
    OAuthProvider.OPEN_AI_CODEX,
    TEST_MODEL,
    [],
  );

  expect(baseAgent.agent.state.systemPrompt).toBe(defaultPrompt);
});

test("BaseAgent.create prefers an explicit system prompt override", async () => {
  const baseAgent = await BaseAgent.create(
    "test-agent",
    OAuthProvider.OPEN_AI_CODEX,
    TEST_MODEL,
    [],
    "Use the explicit test prompt",
  );

  expect(baseAgent.agent.state.systemPrompt).toBe(
    "Use the explicit test prompt",
  );
});
