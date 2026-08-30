/**
 * Cross-device sign-in: an order placed on one "browser" becomes visible on
 * another only after proving ownership of the phone number with a one-time
 * code. Wrong guesses burn attempts; the code is single-use.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { LAHORE_AREAS } from "@four/shared";
import { buildApp } from "../src/app.js";

let app: FastifyInstance;

function client() {
  let cookie: string | undefined;
  async function call(method: "GET" | "POST", url: string, payload?: unknown) {
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
  return { get: (u: string) => call("GET", u), post: (u: string, p?: unknown) => call("POST", u, p) };
}

const area = LAHORE_AREAS[0];
const PHONE = "03211112233";

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(Date.UTC(2026, 7, 20, 15, 0)));
  app = await buildApp({ testing: true });
});

afterAll(async () => {
  vi.useRealTimers();
  await app.close();
});

describe("OTP sign-in", () => {
  it("links a fresh device to the phone's order history", async () => {
    // device A orders
    const a = client();
    const { body: menu } = await a.get("/api/menu");
    const item = (menu.categories as { items: { id: string; variants?: unknown[] }[] }[])
      .flatMap((x) => x.items)
      .find((i) => !i.variants?.length)!;
    await a.post("/api/cart/lines", { itemId: item.id, qty: 1 });
    const { body: quote } = await a.post("/api/orders/quote", { payment: "COD" });
    const { body: order } = await a.post("/api/orders", {
      name: "OTP Customer",
      phone: PHONE,
      areaId: area.id,
      block: area.blocks[0],
      address: "House 7, Street 1, Lahore",
      payment: "COD",
      confirmToken: quote.confirmToken,
    });
    const orderNumber = (order as { orderNumber: string }).orderNumber;
    expect(orderNumber).toBeTruthy();

    // device B sees nothing...
    const b = client();
    const before = await b.get("/api/orders/mine");
    expect((before.body.orders as unknown[]).length).toBe(0);

    // ...requests a code (dev mode returns it) and verifies
    const req = await b.post("/api/auth/request-code", { phone: PHONE });
    expect(req.status).toBe(200);
    const devCode = req.body.devCode as string;
    expect(devCode).toMatch(/^\d{6}$/);

    const verify = await b.post("/api/auth/verify-code", { phone: PHONE, code: devCode });
    expect(verify.status).toBe(200);
    expect((verify.body.customer as { phone: string }).phone).toBe(PHONE);

    const after = await b.get("/api/orders/mine");
    const numbers = (after.body.orders as { orderNumber: string }[]).map((o) => o.orderNumber);
    expect(numbers).toContain(orderNumber);

    // the code is single-use
    const replay = await b.post("/api/auth/verify-code", { phone: PHONE, code: devCode });
    expect(replay.status).toBe(400);

    // sign out unlinks
    await b.post("/api/auth/logout");
    const me = await b.get("/api/auth/me");
    expect(me.body.customer).toBeNull();
  });

  it("rejects wrong codes and rate-limits resends", async () => {
    const c = client();
    const phone = "03214445566";
    const req = await c.post("/api/auth/request-code", { phone });
    expect(req.status).toBe(200);

    const bad = await c.post("/api/auth/verify-code", { phone, code: "000000" });
    expect(bad.status).toBe(400);
    expect((bad.body.error as { code: string }).code).toBe("BAD_CODE");

    // immediate resend is refused (30s cooldown)
    const tooSoon = await c.post("/api/auth/request-code", { phone });
    expect(tooSoon.status).toBe(400);
    expect((tooSoon.body.error as { code: string }).code).toBe("TOO_SOON");
  });
});
