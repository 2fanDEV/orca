import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readAuthFile, writeAuthFile, type AuthFile } from "./file";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "base-agent-auth-"));
});

afterEach(async () => {
  await rm(tempDir, { force: true, recursive: true });
});

test("readAuthFile returns an empty object when the auth file is missing", async () => {
  const authFilePath = join(tempDir, ".agent", "auth.json");

  expect(await readAuthFile(authFilePath)).toEqual({});
});

test("writeAuthFile persists auth data that readAuthFile can load", async () => {
  const authFilePath = join(tempDir, ".agent", "auth.json");
  const auth: AuthFile = {
    "openai-codex": {
      access: "access-token",
      refresh: "refresh-token",
      expires: Date.now() + 60_000,
      accountId: "acct_123",
    },
  };

  await writeAuthFile(auth, authFilePath);

  expect(await readAuthFile(authFilePath)).toEqual(auth);
});
