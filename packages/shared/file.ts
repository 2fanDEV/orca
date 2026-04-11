import type { OAuthCredentials } from "@mariozechner/pi-ai";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

export type StoredAuth = OAuthCredentials & {
  accountId?: string;
  api_key?: string;
  endpoint?: string;
  type?: string;
};

export type AuthFile = Record<string, StoredAuth>;

const DEFAULT_AUTH_FILE = ".agent/auth.json";

export async function readAuthFile(filePath = DEFAULT_AUTH_FILE): Promise<AuthFile> {
  const file = Bun.file(filePath);
  if (!(await file.exists())) return {};
  return JSON.parse(await file.text()) as AuthFile;
}

export async function writeAuthFile(auth: AuthFile, filePath = DEFAULT_AUTH_FILE) {
  await mkdir(dirname(filePath), { recursive: true });
  const file = Bun.file(filePath);
  await file.write(JSON.stringify(auth, null, 2));
}
