/**
 * The kitchen console is protected by a 4-8 digit PIN typed on a tablet.
 * Four digits is only 10,000 combinations, so the lockout is the control that
 * actually makes it safe - these pin its behaviour.
 *
 * Note the lockout counter is module state in routes/admin.ts, shared by every
 * app instance in the process, so this file builds its own app and runs alone
 * (vitest fileParallelism is off).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";

const PIN = "824193"; // matches vitest.config.ts
let app: FastifyInstance;

function client() {
  let cookie: string | undefined;
  return async function call(method: "GET" | "POST", url: string, payload?: unknown) {
    const res = await app.inject({ method, url, payload: payload as object | undefined, headers: cookie ? { cookie } : {} });
    const set = res.cookies.find((c) => c.name === "four_session");
    if (set) cookie = `four_session=${set.value}`;
    let body: unknown;
    try { body = res.json(); } catch { body = undefined; }
    return { status: res.statusCode, body: body as Record<string, unknown> };
  };
}

beforeAll(async () => {
  app = await buildApp({ testing: true });
});
afterAll(async () => {
  await app.close();
});

describe("kitchen console PIN", () => {
  it("refuses the order board without signing in", async () => {
    const call = client();
    const { status, body } = await call("GET", "/api/admin/orders");
    expect(status).toBe(403);
    expect((body.error as { code: string }).code).toBe("FORBIDDEN");
  });

  it("rejects a wrong PIN", async () => {
    const call = client();
    const { status, body } = await call("POST", "/api/admin/login", { pin: "000000" });
    expect(status).toBe(401);
    expect((body.error as { code: string }).code).toBe("BAD_PIN");
  });

  it("locks out after repeated wrong PINs, and the lockout outlasts a correct one", async () => {
    const call = client();
    for (let i = 0; i < 5; i++) {
      await call("POST", "/api/admin/login", { pin: "000000" });
    }

    // the right PIN must not open the door while the lockout stands, or the
    // lockout would only be slowing an attacker down between guesses
    const { status, body } = await call("POST", "/api/admin/login", { pin: PIN });
    expect(status).toBe(429);
    expect((body.error as { code: string }).code).toBe("LOCKED_OUT");

    const board = await call("GET", "/api/admin/orders");
    expect(board.status).toBe(403);
  });
});
