/**
 * The POS reliability queue: a misconfigured bridge still cancels loudly at
 * checkout (retrying cannot fix missing credentials), while a transient
 * gateway failure keeps the order alive with retries scheduled.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { LAHORE_AREAS } from "@four/shared";
import { prisma } from "@four/db";
import { buildApp } from "../src/app.js";
import { config } from "../src/config.js";

let app: FastifyInstance;
const saved = {
  pos: config.POS_PROVIDER,
  url: config.CORNPOS_API_URL,
  key: config.CORNPOS_API_KEY,
  webhookUrl: config.POS_WEBHOOK_URL,
};

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

async function placeOrder(c: ReturnType<typeof client>) {
  const { body: menu } = await c.get("/api/menu");
  const item = (menu.categories as { items: { id: string; variants?: unknown[] }[] }[])
    .flatMap((x) => x.items)
    .find((i) => !i.variants?.length)!;
  await c.post("/api/cart/lines", { itemId: item.id, qty: 1 });
  const { body: quote } = await c.post("/api/orders/quote", { payment: "COD" });
  return c.post("/api/orders", {
    name: "Queue Test",
    phone: "03007776655",
    areaId: area.id,
    block: area.blocks[0],
    address: "House 3, Street 9, Lahore",
    payment: "COD",
    confirmToken: quote.confirmToken,
  });
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

afterEach(() => {
  config.POS_PROVIDER = saved.pos;
  config.CORNPOS_API_URL = saved.url;
  config.CORNPOS_API_KEY = saved.key;
  config.POS_WEBHOOK_URL = saved.webhookUrl;
  vi.unstubAllGlobals();
});

describe("POS queue", () => {
  it("marks a healthy submit SENT", async () => {
    const { status, body } = await placeOrder(client()); // console adapter
    expect(status).toBe(200);
    const row = await prisma.order.findUnique({ where: { orderNumber: body.orderNumber as string } });
    expect(row?.posStatus).toBe("SENT");
  });

  it("cancels loudly and immediately on a configuration error", async () => {
    config.POS_PROVIDER = "webhook"; // no POS_WEBHOOK_URL -> "not configured"
    config.POS_WEBHOOK_URL = undefined;
    const { status, body } = await placeOrder(client());
    expect(status).toBe(502);
    expect((body.error as { code: string }).code).toBe("POS_DOWN");
  });

  it("keeps the order alive and schedules a retry on a transient failure", async () => {
    config.POS_PROVIDER = "cornpos";
    config.CORNPOS_API_URL = "https://pos.example.test/orders";
    config.CORNPOS_API_KEY = "k";
    vi.stubGlobal("fetch", vi.fn(async () => new Response("boom", { status: 503 })));

    const { status, body } = await placeOrder(client());
    expect(status).toBe(200); // the customer's order is accepted
    const row = await prisma.order.findUnique({ where: { orderNumber: body.orderNumber as string } });
    expect(row?.status).toBe("CONFIRMED");
    expect(row?.posStatus).toBe("PENDING");
    expect(row?.posAttempts).toBe(1);
    expect(row?.posLastError).toContain("503");
  });
});
