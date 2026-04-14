import express from "express";
import request from "supertest";
import { expect, test } from "vitest";
import { createToolRegistrationHandler } from "./toolHandler";

test("registers a tool when the route and body ids match", async () => {
  const registeredTools: string[] = [];
  const app = createTestApp(async (tool) => {
    registeredTools.push(tool.id);
    return true;
  });

  const response = await request(app)
    .post("/tools/add/test-tool")
    .send({
      id: "test-tool",
      tool: {
        name: "test-tool",
        description: "A test tool",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
    });

  expect(response.status).toBe(201);
  expect(registeredTools).toEqual(["test-tool"]);
});

test("rejects a request when the tool id does not match the route", async () => {
  const app = createTestApp(async () => true);

  const response = await request(app)
    .post("/tools/add/test-tool")
    .send({
      id: "different-tool",
      tool: {
        name: "test-tool",
        description: "A test tool",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
    });

  expect(response.status).toBe(400);
  expect(response.body).toEqual({
    message: "Tool id in the request body must match the route parameter.",
  });
});

test("returns conflict when the tool is already registered", async () => {
  const app = createTestApp(async () => false);

  const response = await request(app)
    .post("/tools/add/test-tool")
    .send({
      id: "test-tool",
      tool: {
        name: "test-tool",
        description: "A test tool",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
    });

  expect(response.status).toBe(409);
  expect(response.body).toEqual({
    message: "Tool test-tool is already registered.",
  });
});

function createTestApp(
  registerTool: Parameters<typeof createToolRegistrationHandler>[0],
) {
  const app = express();
  app.post(
    "/tools/add/:toolId",
    express.json(),
    createToolRegistrationHandler(registerTool),
  );
  return app;
}
