import { platform, stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import type {
  OAuthCredentials,
  OAuthLoginCallbacks,
  OAuthPrompt,
  Provider,
} from "@mariozechner/pi-ai";
import { getOAuthProvider } from "@mariozechner/pi-ai/oauth";
import { readAuthFile, writeAuthFile } from "../shared/file";
import { UserInputRequiredError } from "../shared/userInput";

type MaybePromise<T> = T | Promise<T>;

export interface OAuthInteractionHandlers {
  showMessage?: (message: string) => MaybePromise<void>;
  openUrl?: (url: string) => MaybePromise<void>;
  promptUser?: (prompt: OAuthPrompt) => Promise<string>;
}

export interface OAuthLoginOptions {
  interaction?: OAuthInteractionHandlers;
  signal?: AbortSignal;
}

export async function oauthRefresh(
  provider: Provider,
  oauthCredentials: OAuthCredentials,
) {
  const oauthProvider = getOAuthProvider(provider);
  if (!oauthProvider) {
    throw new Error(`Unsupported provider: ${provider}`);
  }
  const credentials = await oauthProvider.refreshToken(oauthCredentials);
  return credentials;
}

export async function oauthLogin(
  provider: Provider,
  options: OAuthLoginOptions = {},
) {
  const credentials = await startOAuthRedirect(provider, options);
  const auth = await readAuthFile();
  auth[provider] = credentials;
  await writeAuthFile(auth);
}

async function startOAuthRedirect(
  provider: Provider,
  options: OAuthLoginOptions,
) {
  const interaction = getOAuthInteractionHandlers(options.interaction);
  const callbacks: OAuthLoginCallbacks = {
    onAuth: async (info) => {
      await interaction.showMessage(
        `Open this URL in your browser:\n${info.url}`,
      );

      if (info.instructions) {
        await interaction.showMessage(info.instructions);
      }

      await interaction.openUrl?.(info.url);
    },
    onPrompt: async (prompt) => {
      if (interaction.promptUser) {
        return interaction.promptUser(prompt);
      }

      throw new UserInputRequiredError({
        message: prompt.message,
        placeholder: prompt.placeholder,
        allowEmpty: prompt.allowEmpty,
      });
    },
    onProgress: interaction.showMessage,
    signal: options.signal,
  };

  return oauthLoginWithCallbacks(provider, callbacks);
}

async function oauthLoginWithCallbacks(
  provider: Provider,
  callbacks: OAuthLoginCallbacks,
) {
  const oauthProvider = getOAuthProvider(provider);
  if (!oauthProvider) {
    throw new Error(`Unsupported provider: ${provider}`);
  }
  return oauthProvider.login(callbacks);
}

function getOAuthInteractionHandlers(
  interaction: OAuthInteractionHandlers | undefined,
) {
  const defaultInteraction = createDefaultOAuthInteractionHandlers();

  return {
    showMessage: interaction?.showMessage ?? defaultInteraction.showMessage,
    openUrl: interaction?.openUrl ?? defaultInteraction.openUrl,
    promptUser: interaction?.promptUser ?? defaultInteraction.promptUser,
  };
}

function createDefaultOAuthInteractionHandlers() {
  const interactive = stdin.isTTY && stdout.isTTY;

  return {
    showMessage(message: string) {
      console.log(message);
    },
    async openUrl(url: string) {
      const command = getOpenUrlCommand(url);

      if (!command) {
        return;
      }

      try {
        Bun.spawn({
          cmd: command,
          stdin: "ignore",
          stdout: "ignore",
          stderr: "ignore",
        });
      } catch {
        // The auth URL is already printed, so auto-open failure is non-fatal.
      }
    },
    promptUser: interactive ? promptFromTerminal : undefined,
  };
}

function getOpenUrlCommand(url: string) {
  switch (platform) {
    case "darwin":
      return ["open", url];
    case "win32":
      return ["cmd", "/c", "start", "", url];
    default:
      return ["xdg-open", url];
  }
}

async function promptFromTerminal(prompt: OAuthPrompt) {
  const rl = createInterface({ input: stdin, output: stdout });

  try {
    while (true) {
      const answer = await rl.question(formatTerminalPrompt(prompt));
      if (answer || prompt.allowEmpty) {
        return answer;
      }
    }
  } finally {
    rl.close();
  }
}

function formatTerminalPrompt(prompt: OAuthPrompt) {
  const placeholder = prompt.placeholder ? ` [${prompt.placeholder}]` : "";
  const optionalLabel = prompt.allowEmpty ? " (optional)" : "";
  return `${prompt.message}${placeholder}${optionalLabel}: `;
}
