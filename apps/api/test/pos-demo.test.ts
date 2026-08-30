/**
 * The demo POS provider. It exists so a POS vendor can be shown the exact
 * payload their endpoint would receive, before any integration is built - so
 * what matters is that the captured payload really is what the bridge sends.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { LAHORE_AREAS } from "@four/shared";
import { buildApp } from "../src/app.js";

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
  // orders are refused outside opening hours; hold the clock at 8pm Lahore
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(Date.UTC(2026, 7, 20, 15, 0)));
  app = await buildApp({ testing: true });
});

afterAll(async () => {
  vi.useRealTimers();
  await app.close();
});

describe("POS feed", () => {
  it("is admin-only", async () => {
    const call = client();
    const { status } = await call("GET", "/api/admin/pos-feed");
    expect(status).toBe(403);
  });

  it("reports which provider is active", async () => {
    const call = client();
    await call("POST", "/api/admin/login", { pin: "824193" });
    const { status, body } = await call("GET", "/api/admin/pos-feed");
    expect(status).toBe(200);
    // the suite runs with POS_PROVIDER=console, so nothing is captured; the
    // route must still answer, because the console tells you why it is empty
    expect(body.provider).toBe("console");
    expect(Array.isArray(body.entries)).toBe(true);
  });

  it("captures nothing under a provider that is not demo", async () => {
    const call = client();
    const { body: menu } = await call("GET", "/api/menu");
    const cats = menu.categories as { items: { id: string; variants?: unknown[] }[] }[];
    const item = cats.flatMap((c) => c.items).find((i) => !i.variants?.length)!;
    await call("POST", "/api/cart/lines", { itemId: item.id, qty: 1 });
    const { body: quote } = await call("POST", "/api/orders/quote", { payment: "COD" });
    const area = LAHORE_AREAS[0];
    const placed = await call("POST", "/api/orders", {
      name: "Feed Test",
      phone: "03001234567",
      areaId: area.id,
      block: area.blocks[0],
      address: "House 12, Street 8, Lahore",
      payment: "COD",
      confirmToken: quote.confirmToken as string,
    });
    expect(placed.status).toBe(200);

    await call("POST", "/api/admin/login", { pin: "824193" });
    const { body } = await call("GET", "/api/admin/pos-feed");
    expect(body.entries).toEqual([]);
  });
});
