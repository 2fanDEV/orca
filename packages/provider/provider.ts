import { readAuthFile } from "../shared/file";
import { oauthLogin } from "./oauth";

export type Provider = OAuthProvider | ApiProvider;
export type Connection = OAuthConnection | ApiKeyConnection;

export enum OAuthProvider {
  GOOGLE_GEMINI_CLI = "google-gemini-cli",
  GITHUB_COPILOT = "github-copilot",
  OPEN_AI_CODEX = "openai-codex",
  ANTHROPIC = "anthropic",
}

export enum ApiProvider {
  ANTHROPIC = "anthropic",
  OPENAI = "openai",
  GEMINI = "google",
}

export interface ProviderAuthenticationDetail {
  provider: Provider;
  token?: string;
  refreshToken?: string;
  expiresAt?: number;
  accountId?: string;
  api_key?: string;
  endpoint: string;

  login(): Promise<void>;
}

class OAuthConnection implements ProviderAuthenticationDetail {
  provider: OAuthProvider;
  access?: string | undefined;
  refresh?: string | undefined;
  expires?: number | undefined;
  accountId?: string | undefined;
  api_key?: string | undefined;
  endpoint: string;

  constructor(provider: OAuthProvider, endpoint: string) {
    this.provider = provider;
    this.endpoint = endpoint;
  }

  async login(): Promise<void> {
    let auth = await readAuthFile();
    if (!auth[this.provider] || auth[this.provider].expires < Date.now()) {
      await oauthLogin(this.provider);
      auth = await readAuthFile();
    }
    this.access = auth[this.provider].access;
    this.refresh = auth[this.provider]?.refresh;
    this.expires = auth[this.provider]?.expires;
    this.accountId = auth[this.provider]?.accountId;
    this.api_key = auth[this.provider]?.api_key;
  }

  async changeProvider(provider: OAuthProvider) {
    this.provider = provider;
    await this.login();
  }
}

class ApiKeyConnection implements ProviderAuthenticationDetail {
  provider: ApiProvider;
  api_key?: string | undefined;
  endpoint: string;

  constructor(provider: ApiProvider, endpoint: string) {
    this.provider = provider;
    this.endpoint = endpoint;
  }

  async login(): Promise<void> {
    // TODO: Implement API key connection check
  }
}
