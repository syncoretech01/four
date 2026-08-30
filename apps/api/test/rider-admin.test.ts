/**
 * Rider management from the kitchen console: onboarding, PIN reset,
 * branch moves, and the active flag actually locking a rider out.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { config } from "../src/config.js";

let app: FastifyInstance;

function client() {
  let cookie: string | undefined;
  async function call(method: "GET" | "POST" | "PATCH", url: string, payload?: unknown) {
    const res = await app.inject({ method, url, payload: payload as object | undefined, headers: cookie ? { cookie } : {} });
    const set = res.cookies.find((c) => c.name === "four_session");
    if (set) cookie = `four_session=${set.value}`;
    let body: unknown;
    try {
      body = res.json();
    } catch {
      body = undefined;
    }
    return { status: res.statusCode, body: body as Record<string, unknown> };
  }
  return {
    get: (u: string) => call("GET", u),
    post: (u: string, p?: unknown) => call("POST", u, p),
    patch: (u: string, p?: unknown) => call("PATCH", u, p),
  };
}

async function adminClient() {
  const c = client();
  const login = await c.post("/api/admin/login", { pin: config.ADMIN_PIN });
  expect(login.status).toBe(200);
  return c;
}

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(Date.UTC(2026, 7, 20, 15, 0)));
  app = await buildApp({ testing: true });
});

afterAll(async () => {
  vi.useRealTimers();
  await app.close();
});

describe("rider management", () => {
  it("onboards a rider who can then sign in; deactivating locks them out", async () => {
    const admin = await adminClient();

    const created = await admin.post("/api/admin/riders", {
      name: "Test Rider",
      phone: "0311 1234567",
      pin: "9876",
      branchId: "fairways-dha6",
    });
    expect(created.status).toBe(200);
    const rider = created.body.rider as { id: string; phone: string; active: boolean };
    expect(rider.phone).toBe("03111234567"); // normalized
    expect(rider.active).toBe(true);

    // duplicate phone is refused
    const dup = await admin.post("/api/admin/riders", {
      name: "Clone",
      phone: "03111234567",
      pin: "1111",
      branchId: "fairways-dha6",
    });
    expect(dup.status).toBe(400);

    // the rider can sign in on their own device
    const phoneApp = client();
    const login = await phoneApp.post("/api/rider/login", { phone: "03111234567", pin: "9876" });
    expect(login.status).toBe(200);

    // PIN reset + branch move
    const patched = await admin.patch(`/api/admin/riders/${rider.id}`, { pin: "5555", branchId: "lake-city" });
    expect(patched.status).toBe(200);
    expect((patched.body.rider as { branchId: string }).branchId).toBe("lake-city");

    const oldPin = await client().post("/api/rider/login", { phone: "03111234567", pin: "9876" });
    expect(oldPin.status).not.toBe(200);
    const newPin = await client().post("/api/rider/login", { phone: "03111234567", pin: "5555" });
    expect(newPin.status).toBe(200);

    // deactivation ends the login and blocks new ones
    const off = await admin.patch(`/api/admin/riders/${rider.id}`, { active: false });
    expect((off.body.rider as { active: boolean }).active).toBe(false);
    const locked = await client().post("/api/rider/login", { phone: "03111234567", pin: "5555" });
    expect(locked.status).not.toBe(200);
  });

  it("requires an admin session", async () => {
    const anon = client();
    await anon.get("/api/cart"); // mint a session
    const res = await anon.post("/api/admin/riders", {
      name: "Sneaky",
      phone: "03119990000",
      pin: "0000",
      branchId: "fairways-dha6",
    });
    expect(res.status).toBe(403);
  });
});
