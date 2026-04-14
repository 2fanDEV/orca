import type { RequestHandler } from "express";
import { ToolDefinitionSchema } from "../../shared/agent/validation";
import type { ToolDefinition } from "../../shared/agent/tool";

type RegisterTool = (tool: ToolDefinition) => Promise<boolean> | boolean;

export function createToolRegistrationHandler(
  registerTool: RegisterTool,
): RequestHandler {
  return async (req, res) => {
    const parsed = ToolDefinitionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(parsed.error.format());
      return;
    }

    if (parsed.data.id !== req.params.toolId) {
      res.status(400).json({
        message: "Tool id in the request body must match the route parameter.",
      });
      return;
    }

    if (!(await registerTool(parsed.data))) {
      res.status(409).json({
        message: `Tool ${parsed.data.id} is already registered.`,
      });
      return;
    }

    res.status(201).json({
      message: `Tool ${parsed.data.id} registered successfully.`,
    });
  };
}
