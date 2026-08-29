import { execFileSync } from "node:child_process";
import { resolveTestDatabaseUrl } from "./testEnv.js";

/**
 * Creates (Prisma does this on deploy), migrates and seeds the test database
 * once per run. The suite asserts on real menu prices, so it needs the seed.
 */
export default function setup(): void {
  const DATABASE_URL = resolveTestDatabaseUrl();
  const env = { ...process.env, DATABASE_URL };
  const run = (args: string[]) =>
    execFileSync("pnpm", args, { env, stdio: "inherit", cwd: new URL("../../../packages/db", import.meta.url).pathname });

  run(["exec", "prisma", "migrate", "deploy"]);
  run(["run", "seed"]);
}
