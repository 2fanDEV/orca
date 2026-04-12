import type { AgentCard } from "@a2a-js/sdk";
import type { AgentServerConfig } from "./types";

export async function registerAgent(
  config: AgentServerConfig,
  agentCard: AgentCard,
) {
  const response = await fetch(
    `${trimTrailingSlash(config.registryBaseUrl)}/register/${config.agentId}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        card: agentCard,
        location: config.publicBaseUrl,
        tags: config.tags,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to register agent ${config.agentId}: ${response.status} ${await response.text()}`,
    );
  }
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}
