/**
 * Opening hours: 1:00pm to 3:00am Lahore time, confirmed by operations.
 * The window crosses midnight, which is exactly where this kind of check goes
 * wrong, so the boundaries are pinned minute by minute.
 */
import { afterEach, beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { LAHORE_AREAS, isOpenAt } from "@four/shared";
import { buildApp } from "../src/app.js";

/** A Date for the given Lahore wall-clock time (Lahore is UTC+5). */
function lahore(hour: number, minute = 0): Date {
  return new Date(Date.UTC(2026, 7, 20, hour - 5, minute));
}

describe("isOpenAt", () => {
  it("is open through the evening", () => {
    expect(isOpenAt(lahore(13, 0))).toBe(true); // opens exactly at 1pm
    expect(isOpenAt(lahore(20, 0))).toBe(true);
    expect(isOpenAt(lahore(23, 59))).toBe(true);
  });

  it("stays open across midnight until 3am", () => {
    expect(isOpenAt(lahore(24, 0))).toBe(true); // midnight
    expect(isOpenAt(lahore(26, 59))).toBe(true); // 2:59am
  });

  it("is closed from 3am until 1pm", () => {
    expect(isOpenAt(lahore(27, 0))).toBe(false); // 3:00am exactly - closed
    expect(isOpenAt(lahore(28, 0))).toBe(false); // 4am
    expect(isOpenAt(lahore(12, 59))).toBe(false); // a minute before opening
  });
});

describe("checkout outside opening hours", () => {
  let app: FastifyInstance;
  beforeAll(async () => {
    app = await buildApp({ testing: true });
  });
  afterAll(async () => {
    await app.close();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

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

  async function quotedCart() {
    const call = client();
    const { body: menu } = await call("GET", "/api/menu");
    const cats = menu.categories as { items: { id: string; variants?: unknown[] }[] }[];
    const item = cats.flatMap((c) => c.items).find((i) => !i.variants?.length)!;
    await call("POST", "/api/cart/lines", { itemId: item.id, qty: 1 });
    const { body: quote } = await call("POST", "/api/orders/quote", { payment: "COD" });
    return { call, quote };
  }

  const area = LAHORE_AREAS[0];
  const checkout = (confirmToken: string) => ({
    name: "Night Owl",
    phone: "03001234567",
    areaId: area.id,
    block: area.blocks[0],
    address: "House 12, Street 8, Lahore",
    payment: "COD" as const,
    confirmToken,
  });

  it("refuses an order at 4am and says when it reopens", async () => {
    const { call, quote } = await quotedCart();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(lahore(28, 0)); // 4:00am Lahore

    const { status, body } = await call("POST", "/api/orders", checkout(quote.confirmToken as string));
    expect(status).toBe(400);
    const err = body.error as { code: string; message: string };
    expect(err.code).toBe("CLOSED");
    expect(err.message).toContain("1:00 pm");
  });

  it("accepts the same order at 2:59am, a minute before closing", async () => {
    const { call, quote } = await quotedCart();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(lahore(26, 59));

    const { status } = await call("POST", "/api/orders", checkout(quote.confirmToken as string));
    expect(status).toBe(200);
  });
});
