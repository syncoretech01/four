/**
 * The online-payment rail, on the demo gateway: a card order is held as
 * PENDING_PAYMENT (invisible to the kitchen), the confirm flips it CONFIRMED,
 * and confirming twice cannot double-fire. Real gateways swap the confirm
 * for a webhook; everything else here is the rail they ride.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { LAHORE_AREAS } from "@four/shared";
import { prisma } from "@four/db";
import { buildApp } from "../src/app.js";
import { config } from "../src/config.js";

let app: FastifyInstance;
const savedProvider = config.PAYMENT_PROVIDER;

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

async function placeCardOrder(c: ReturnType<typeof client>) {
  const { body: menu } = await c.get("/api/menu");
  const item = (menu.categories as { items: { id: string; basePrice: number; variants?: unknown[] }[] }[])
    .flatMap((x) => x.items)
    .find((i) => !i.variants?.length)!;
  await c.post("/api/cart/lines", { itemId: item.id, qty: 1 });
  const { body: quote } = await c.post("/api/orders/quote", { payment: "CARD" });
  const { status, body } = await c.post("/api/orders", {
    name: "Card Customer",
    phone: "03009998877",
    areaId: area.id,
    block: area.blocks[0],
    address: "House 4, Street 2, Lahore",
    payment: "CARD",
    confirmToken: quote.confirmToken,
  });
  expect(status).toBe(200);
  return body as { orderNumber: string; status: string; paymentUrl?: string };
}

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(Date.UTC(2026, 7, 20, 15, 0)));
  config.PAYMENT_PROVIDER = "demo";
  app = await buildApp({ testing: true });
});

afterAll(async () => {
  config.PAYMENT_PROVIDER = savedProvider;
  vi.useRealTimers();
  await app.close();
});

describe("demo payment rail", () => {
  it("holds a card order at PENDING_PAYMENT with a pay link, then confirms it", async () => {
    const c = client();
    const order = await placeCardOrder(c);
    expect(order.status).toBe("PENDING_PAYMENT");
    expect(order.paymentUrl).toContain(`/pay/${order.orderNumber}?t=`);

    const token = new URL(order.paymentUrl!).searchParams.get("t")!;
    const confirm = await c.post("/api/payments/demo/confirm", { orderNumber: order.orderNumber, token });
    expect(confirm.status).toBe(200);
    expect((confirm.body.order as { status: string }).status).toBe("CONFIRMED");

    const row = await prisma.order.findUnique({ where: { orderNumber: order.orderNumber } });
    expect(row?.paidAt).toBeTruthy();
  });

  it("rejects a forged token and stays unpaid", async () => {
    const c = client();
    const order = await placeCardOrder(c);
    const res = await c.post("/api/payments/demo/confirm", { orderNumber: order.orderNumber, token: "a".repeat(43) });
    expect(res.status).toBe(403);
    const row = await prisma.order.findUnique({ where: { orderNumber: order.orderNumber } });
    expect(row?.status).toBe("PENDING_PAYMENT");
  });

  it("is idempotent: a second confirm changes nothing", async () => {
    const c = client();
    const order = await placeCardOrder(c);
    const token = new URL(order.paymentUrl!).searchParams.get("t")!;
    await c.post("/api/payments/demo/confirm", { orderNumber: order.orderNumber, token });
    const again = await c.post("/api/payments/demo/confirm", { orderNumber: order.orderNumber, token });
    expect(again.status).toBe(200);
    const row = await prisma.order.findUnique({ where: { orderNumber: order.orderNumber } });
    expect(row?.status).toBe("CONFIRMED");
    expect((await prisma.orderEvent.count({ where: { orderId: row!.id, status: "CONFIRMED" } }))).toBe(1);
  });

  it("keeps COD orders on the old rail - confirmed immediately, no pay link", async () => {
    const c = client();
    const { body: menu } = await c.get("/api/menu");
    const item = (menu.categories as { items: { id: string; variants?: unknown[] }[] }[])
      .flatMap((x) => x.items)
      .find((i) => !i.variants?.length)!;
    await c.post("/api/cart/lines", { itemId: item.id, qty: 1 });
    const { body: quote } = await c.post("/api/orders/quote", { payment: "COD" });
    const { body: order } = await c.post("/api/orders", {
      name: "Cash Customer",
      phone: "03009998877",
      areaId: area.id,
      block: area.blocks[0],
      address: "House 4, Street 2, Lahore",
      payment: "COD",
      confirmToken: quote.confirmToken,
    });
    expect((order as { status: string }).status).toBe("CONFIRMED");
    expect((order as { paymentUrl?: string }).paymentUrl).toBeUndefined();
  });
});
