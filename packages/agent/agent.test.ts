import { expect, test } from "vitest";
import type { Model } from "@mariozechner/pi-ai";
import { OAuthProvider } from "../provider/provider";
import { readTextFile } from "../shared/runtime";
import { BaseAgent } from "./agent";

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
  const defaultPrompt = await readTextFile(
    new URL("./defaults/default_base_agent.md", import.meta.url),
  );

  const baseAgent = await BaseAgent.create(
    "test-agent",
    OAuthProvider.OPEN_AI_CODEX,
    TEST_MODEL,
    [],
  );

  expect(baseAgent.get_system_prompt()).toBe(defaultPrompt);
});

test("BaseAgent.create prefers an explicit system prompt override", async () => {
  const baseAgent = await BaseAgent.create(
    "test-agent",
    OAuthProvider.OPEN_AI_CODEX,
    TEST_MODEL,
    [],
    "Use the explicit test prompt",
  );

  expect(baseAgent.get_system_prompt()).toBe("Use the explicit test prompt");
});
