import { spawn } from "node:child_process";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export async function fileExists(path: string | URL) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function readTextFile(path: string | URL) {
  return readFile(path, "utf8");
}

export async function writeTextFile(path: string, content: string) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, "utf8");
}

export function getEnv(name: string) {
  return process.env[name];
}

export function spawnDetached(command: string[]) {
  const child = spawn(command[0], command.slice(1), {
    detached: true,
    stdio: "ignore",
  });
  child.unref();
}
