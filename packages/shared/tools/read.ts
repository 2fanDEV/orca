import { Type } from "@sinclair/typebox";
import type { ToolDefinition } from "../agent/tool";
import { readTextFile, writeTextFile } from "../runtime";
import { defineTypedTool } from "./helper";

const baseParam = Type.Object({
  path: Type.String({ description: "File path" }),
});

const contentParam = Type.Object({
  path: Type.String({ description: "File path" }),
  content: Type.String({ description: "File content" }),
});

type BaseParam = typeof baseParam;
type ContentParam = typeof contentParam;

function fileTools(): ToolDefinition[] {
  const read: ToolDefinition = {
    id: "read-file",
    tool: defineTypedTool<BaseParam>({
      label: "Read File",
      name: "Read File Tool",
      description:
        "With this tool you can read a file that is inside of your container.",
      parameters: baseParam,
      execute: async (_id, params, _signal, _onUpdate) => {
        const content = await readTextFile(params.path);
        return {
          content: [{ type: "text", text: content }],
          details: { path: params.path, size: content.length },
        };
      },
    }),
  };

  const write: ToolDefinition = {
    id: "read-file",
    tool: defineTypedTool<ContentParam>({
      label: "Read File",
      name: "Read File Tool",
      description:
        "With this tool you can read a file that is inside of your container.",
      parameters: contentParam,
      execute: async (_id, params, _signal, _onUpdate) => {
        await writeTextFile(params.path, params.content);
        return {
          content: [{ type: "text", text: params.content }],
          details: { path: params.path, res: "File was written successfully!" },
        };
      },
    }),
  };

  return [read, write];
}
