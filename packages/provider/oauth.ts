import type {
  OAuthCredentials,
  OAuthLoginCallbacks,
  Provider,
} from "@mariozechner/pi-ai";
import { getOAuthProvider } from "@mariozechner/pi-ai/oauth";
import { readAuthFile, writeAuthFile } from "../shared/file";

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

export async function oauthLogin(provider: Provider) {
  const credentials = await startOAuthRedirect(provider);
  const auth = await readAuthFile();
  auth[provider] = credentials;
  await writeAuthFile(auth);
}

async function startOAuthRedirect(provider: Provider) {
  const callbacks: OAuthLoginCallbacks = {
    onAuth: (info) => {
      if (info.instructions) console.log(info.instructions);
      Bun.spawn(["open", info.url]);
    },
    onPrompt: async (prompt) => {
      return prompt.message;
    },
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
