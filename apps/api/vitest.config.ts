import { defineConfig } from "vitest/config";
import { resolveTestDatabaseUrl } from "./test/testEnv.js";

const DATABASE_URL = resolveTestDatabaseUrl();

export default defineConfig({
  test: {
    globalSetup: ["./test/globalSetup.ts"],
    // one shared Postgres database, so files must not run concurrently
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 60_000,
    env: {
      DATABASE_URL,
      NODE_ENV: "test",
      // fixed so the HMAC confirm-token assertions are deterministic
      APP_SECRET: "test-secret-at-least-16-chars-long",
      ADMIN_PIN: "824193",
      POS_PROVIDER: "console",
    },
  },
});
