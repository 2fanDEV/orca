export async function readAuthFile() {
  const file = Bun.file(".agent/auth.json");
  if (!(await file.exists())) return {};
  return JSON.parse(await file.text());
}

export async function writeAuthFile(auth: Record<string, unknown>) {
  const file = Bun.file(".agent/auth.json");
  await file.write(JSON.stringify(auth, null, 2));
}
