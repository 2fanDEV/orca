import type { TSchema } from "@mariozechner/pi-ai";

export interface ToolDefinition<
  TParameter extends TSchema = TSchema,
  TDetails = any,
> {
  id: string;
}
