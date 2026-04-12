import type { AgentCard } from "@a2a-js/sdk";
import type { AgentCardConfig } from "./types";

export function createAgentCard(
  publicBaseUrl: string,
  card: AgentCardConfig,
): AgentCard {
  const baseUrl = trimTrailingSlash(publicBaseUrl);

  return {
    name: card.name,
    description: card.description,
    protocolVersion: "0.3.0",
    version: card.version,
    url: `${baseUrl}/a2a/jsonrpc`,
    preferredTransport: "JSONRPC",
    defaultInputModes: card.defaultInputModes ?? ["text/plain"],
    defaultOutputModes: card.defaultOutputModes ?? ["text/plain"],
    capabilities: {
      streaming: false,
      pushNotifications: false,
      stateTransitionHistory: false,
    },
    skills: card.skills,
    additionalInterfaces: [
      {
        url: `${baseUrl}/a2a/jsonrpc`,
        transport: "JSONRPC",
      },
      {
        url: `${baseUrl}/a2a/rest`,
        transport: "HTTP+JSON",
      },
    ],
  };
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}
