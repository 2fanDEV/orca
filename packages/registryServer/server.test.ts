import { afterEach, expect, test } from "bun:test";
import { AgentStatus, type RegisteringAgentEntry } from "../shared/validation";
import { AgentRegistry } from "./server";

const TEST_REGISTERING_AGENT: RegisteringAgentEntry = {
  card: {
    name: "Test Agent",
    url: "http://localhost:4000/a2a/jsonrpc",
    capabilities: {},
    defaultInputModes: ["text/plain"],
    defaultOutputModes: ["text/plain"],
    description: "A test agent",
    skills: [],
    protocolVersion: "0.3.0",
    version: "0.1.0",
  },
  location: "http://localhost:4000",
  tags: {
    transport: "a2a",
  },
};

const registries: AgentRegistry[] = [];

afterEach(() => {
  for (const registry of registries.splice(0)) {
    registry.dispose();
  }
});

test("registering an agent starts the stale timeout immediately", async () => {
  const registry = createRegistry(20);

  expect(registry.registerAgent("agent-1", TEST_REGISTERING_AGENT)).toBe(true);
  expect(registry.getAgent("agent-1")?.status).toBe(AgentStatus.REGISTERED);

  await sleep(35);

  expect(registry.getAgent("agent-1")?.status).toBe(AgentStatus.STALE);
});

test("heartbeats update status, lastSeen, and reset the stale timeout", async () => {
  const registry = createRegistry(40);

  registry.registerAgent("agent-1", TEST_REGISTERING_AGENT);
  const initialLastSeen = registry.getAgent("agent-1")?.lastSeen ?? 0;

  await sleep(30);
  const heartbeatResult = registry.heartbeatAgent("agent-1", {
    status: AgentStatus.BUSY,
  });

  expect(heartbeatResult?.status).toBe(AgentStatus.BUSY);
  expect((heartbeatResult?.lastSeen ?? 0) > initialLastSeen).toBe(true);

  await sleep(20);
  expect(registry.getAgent("agent-1")?.status).toBe(AgentStatus.BUSY);

  await sleep(30);
  expect(registry.getAgent("agent-1")?.status).toBe(AgentStatus.STALE);
});

test("a heartbeat restores a stale agent back to a live status", async () => {
  const registry = createRegistry(20);

  registry.registerAgent("agent-1", TEST_REGISTERING_AGENT);
  await sleep(35);
  expect(registry.getAgent("agent-1")?.status).toBe(AgentStatus.STALE);

  const heartbeatResult = registry.heartbeatAgent("agent-1", {
    status: AgentStatus.IDLE,
  });

  expect(heartbeatResult?.status).toBe(AgentStatus.IDLE);
  expect(registry.getAgent("agent-1")?.status).toBe(AgentStatus.IDLE);
});

function createRegistry(staleTimeoutMs: number) {
  const registry = new AgentRegistry({ staleTimeoutMs });
  registries.push(registry);
  return registry;
}

function sleep(milliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
