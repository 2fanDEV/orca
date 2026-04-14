import type { OAuthCredentials } from "@mariozechner/pi-ai";
import { fileExists, readTextFile, writeTextFile } from "./runtime";

export type StoredAuth = OAuthCredentials & {
  accountId?: string;
  api_key?: string;
  endpoint?: string;
  type?: string;
};

export type AuthFile = Record<string, StoredAuth>;

const DEFAULT_AUTH_FILE = ".agent/auth.json";

export async function readAuthFile(filePath = DEFAULT_AUTH_FILE): Promise<AuthFile> {
  if (!(await fileExists(filePath))) return {};
  return JSON.parse(await readTextFile(filePath)) as AuthFile;
}

export async function writeAuthFile(auth: AuthFile, filePath = DEFAULT_AUTH_FILE) {
  await writeTextFile(filePath, JSON.stringify(auth, null, 2));
}
