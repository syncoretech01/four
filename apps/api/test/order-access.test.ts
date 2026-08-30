/**
 * Order details carry the customer's name, phone and home address. Order
 * numbers are short and enumerable, so the lookup must be scoped to the
 * owner - a different browser session must not be able to read someone
 * else's order by its number.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { LAHORE_AREAS } from "@four/shared";
import { buildApp } from "../src/app.js";
import { config } from "../src/config.js";

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

async function placeOrder(c: ReturnType<typeof client>, phone: string) {
  const { body: menu } = await c.get("/api/menu");
  const item = (menu.categories as { items: { id: string; variants?: unknown[] }[] }[])
    .flatMap((x) => x.items)
    .find((i) => !i.variants?.length)!;
  await c.post("/api/cart/lines", { itemId: item.id, qty: 1 });
  const { body: quote } = await c.post("/api/orders/quote", { payment: "COD" });
  const { body } = await c.post("/api/orders", {
    name: "Private Person",
    phone,
    areaId: area.id,
    block: area.blocks[0],
    address: "House 1, Secret Street",
    payment: "COD",
    confirmToken: quote.confirmToken,
  });
  return (body as { orderNumber: string }).orderNumber;
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

describe("order access control", () => {
  it("lets the placing session read its own order", async () => {
    const c = client();
    const num = await placeOrder(c, "03001112222");
    const res = await c.get(`/api/orders/${num}`);
    expect(res.status).toBe(200);
    expect((res.body.order as { phone: string }).phone).toBe("03001112222");
  });

  it("hides an order from an unrelated session (no PII leak by order number)", async () => {
    const owner = client();
    const num = await placeOrder(owner, "03007778888");

    const attacker = client();
    await attacker.get("/api/cart"); // mint a separate session
    const res = await attacker.get(`/api/orders/${num}`);
    expect(res.status).toBe(404);
    expect(res.body.order).toBeUndefined();
  });

  it("reveals it to that session once they sign in as the owning customer", async () => {
    const owner = client();
    const phone = "03219998877";
    const num = await placeOrder(owner, phone);

    const other = client();
    await other.get("/api/cart");
    expect((await other.get(`/api/orders/${num}`)).status).toBe(404);

    const req = await other.post("/api/auth/request-code", { phone });
    await other.post("/api/auth/verify-code", { phone, code: (req.body as { devCode: string }).devCode });

    const res = await other.get(`/api/orders/${num}`);
    expect(res.status).toBe(200);
  });

  it("lets an admin read any order", async () => {
    const owner = client();
    const num = await placeOrder(owner, "03001110000");
    const admin = client();
    await admin.post("/api/admin/login", { pin: config.ADMIN_PIN });
    const res = await admin.get(`/api/orders/${num}`);
    expect(res.status).toBe(200);
  });
});
