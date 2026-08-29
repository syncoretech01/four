/**
 * Covers the paths where a bug costs money: the delivery-fee threshold, the
 * cash/card tax split, and the HMAC confirm token that stops a customer
 * committing a cart at a total they were never quoted.
 *
 * Runs against a real Postgres seeded with the real menu, through the real
 * Fastify stack, so route wiring and Zod validation are exercised too.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { DELIVERY_FEE, FREE_DELIVERY_ABOVE, LAHORE_AREAS } from "@four/shared";
import { buildApp } from "../src/app.js";

const TAX_RATE_COD = 0.16;
const TAX_RATE_CARD = 0.08;

let app: FastifyInstance;

/** A browser: holds the session cookie the API hands out on first contact. */
function client() {
  let cookie: string | undefined;

  async function call(method: "GET" | "POST" | "PATCH" | "DELETE", url: string, payload?: unknown) {
    const res = await app.inject({
      method,
      url,
      payload: payload as object | undefined,
      headers: cookie ? { cookie } : {},
    });
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
    get: (url: string) => call("GET", url),
    post: (url: string, payload?: unknown) => call("POST", url, payload),
    patch: (url: string, payload?: unknown) => call("PATCH", url, payload),
    del: (url: string) => call("DELETE", url),
  };
}

interface MenuItem {
  id: string;
  name: string;
  basePrice: number;
  variants?: { id: string; label: string; price: number }[];
}

/** An item with no size variants, so quantity maths stays predictable. */
async function plainItem(): Promise<MenuItem> {
  const { body } = await client().get("/api/menu");
  const cats = body.categories as { items: MenuItem[] }[];
  const item = cats.flatMap((c) => c.items).find((i) => !i.variants?.length && i.basePrice > 0);
  if (!item) throw new Error("seed has no variant-free item to test with");
  return item;
}

const area = LAHORE_AREAS[0];

function checkout(confirmToken: string, payment: "COD" | "CARD" = "COD") {
  return {
    name: "Test Customer",
    phone: "03001234567",
    areaId: area.id,
    block: area.blocks[0],
    address: "House 12, Street 8, Lahore",
    payment,
    confirmToken,
  };
}

beforeAll(async () => {
  app = await buildApp({ testing: true });
});

afterAll(async () => {
  await app.close();
});

describe("delivery fee", () => {
  it(`charges Rs. ${DELIVERY_FEE} below the free-delivery threshold`, async () => {
    const c = client();
    const item = await plainItem();
    await c.post("/api/cart/lines", { itemId: item.id, qty: 1 });

    const { body: quote } = await c.post("/api/orders/quote", { payment: "COD" });
    expect(quote.subtotal).toBeLessThan(FREE_DELIVERY_ABOVE);
    expect(quote.deliveryFee).toBe(DELIVERY_FEE);
  });

  it(`waives it at or above Rs. ${FREE_DELIVERY_ABOVE}`, async () => {
    const c = client();
    const item = await plainItem();
    const qty = Math.ceil(FREE_DELIVERY_ABOVE / item.basePrice);
    await c.post("/api/cart/lines", { itemId: item.id, qty });

    const { body: quote } = await c.post("/api/orders/quote", { payment: "COD" });
    expect(quote.subtotal).toBeGreaterThanOrEqual(FREE_DELIVERY_ABOVE);
    expect(quote.deliveryFee).toBe(0);
  });
});

describe("tax", () => {
  it("charges 16% on cash and 8% on card for an identical cart", async () => {
    const c = client();
    const item = await plainItem();
    await c.post("/api/cart/lines", { itemId: item.id, qty: 2 });

    const { body: cod } = await c.post("/api/orders/quote", { payment: "COD" });
    const { body: card } = await c.post("/api/orders/quote", { payment: "CARD" });

    expect(cod.subtotal).toBe(card.subtotal);
    expect(cod.tax).toBe(Math.round((cod.subtotal as number) * TAX_RATE_COD));
    expect(card.tax).toBe(Math.round((card.subtotal as number) * TAX_RATE_CARD));
    expect(cod.tax as number).toBeGreaterThan(card.tax as number);
  });

  it("totals as subtotal + delivery + tax", async () => {
    const c = client();
    const item = await plainItem();
    await c.post("/api/cart/lines", { itemId: item.id, qty: 3 });

    const { body: q } = await c.post("/api/orders/quote", { payment: "COD" });
    expect(q.total).toBe((q.subtotal as number) + (q.deliveryFee as number) + (q.tax as number));
  });
});

describe("quote and order agree", () => {
  // quote() and placeOrder() compute the totals separately; if one is edited
  // and the other is not, the customer is charged a total they never saw.
  it("places the order at exactly the total that was quoted", async () => {
    const c = client();
    const item = await plainItem();
    await c.post("/api/cart/lines", { itemId: item.id, qty: 2 });

    const { body: quote } = await c.post("/api/orders/quote", { payment: "COD" });
    const { status, body: order } = await c.post("/api/orders", checkout(quote.confirmToken as string));

    expect(status).toBe(200);
    expect(order.subtotal).toBe(quote.subtotal);
    expect(order.deliveryFee).toBe(quote.deliveryFee);
    expect(order.tax).toBe(quote.tax);
    expect(order.total).toBe(quote.total);
  });

  it("serves the stored order back with the same totals", async () => {
    const c = client();
    const item = await plainItem();
    await c.post("/api/cart/lines", { itemId: item.id, qty: 1 });
    const { body: quote } = await c.post("/api/orders/quote", { payment: "CARD" });
    const { body: placed } = await c.post("/api/orders", checkout(quote.confirmToken as string, "CARD"));

    const { status, body } = await c.get(`/api/orders/${placed.orderNumber}`);
    expect(status).toBe(200);
    const stored = body.order as Record<string, unknown>;
    expect(stored.total).toBe(quote.total);
    expect(stored.payment).toBe("CARD");
    expect(stored.status).toBe("CONFIRMED");
  });
});

describe("confirm token", () => {
  it("rejects a tampered token", async () => {
    const c = client();
    const item = await plainItem();
    await c.post("/api/cart/lines", { itemId: item.id, qty: 1 });
    const { body: quote } = await c.post("/api/orders/quote", { payment: "COD" });

    const tampered = `${(quote.confirmToken as string).slice(0, -1)}X`;
    const { status, body } = await c.post("/api/orders", checkout(tampered));

    expect(status).toBe(400);
    expect((body.error as { code: string }).code).toBe("STALE_QUOTE");
  });

  it("rejects a token minted for the other payment method", async () => {
    const c = client();
    const item = await plainItem();
    await c.post("/api/cart/lines", { itemId: item.id, qty: 1 });

    // quote as card (8% tax), then try to commit it as cash (16%)
    const { body: cardQuote } = await c.post("/api/orders/quote", { payment: "CARD" });
    const { status, body } = await c.post("/api/orders", checkout(cardQuote.confirmToken as string, "COD"));

    expect(status).toBe(400);
    expect((body.error as { code: string }).code).toBe("STALE_QUOTE");
  });

  it("rejects a token minted before the cart changed", async () => {
    const c = client();
    const item = await plainItem();
    await c.post("/api/cart/lines", { itemId: item.id, qty: 1 });
    const { body: quote } = await c.post("/api/orders/quote", { payment: "COD" });

    // add another item after quoting - the old token must not still commit
    await c.post("/api/cart/lines", { itemId: item.id, qty: 1 });
    const { status, body } = await c.post("/api/orders", checkout(quote.confirmToken as string));

    expect(status).toBe(400);
    expect((body.error as { code: string }).code).toBe("STALE_QUOTE");
  });

  it("rejects another session's token", async () => {
    const a = client();
    const b = client();
    const item = await plainItem();

    await a.post("/api/cart/lines", { itemId: item.id, qty: 1 });
    const { body: quote } = await a.post("/api/orders/quote", { payment: "COD" });

    await b.post("/api/cart/lines", { itemId: item.id, qty: 1 });
    const { status, body } = await b.post("/api/orders", checkout(quote.confirmToken as string));

    expect(status).toBe(400);
    expect((body.error as { code: string }).code).toBe("STALE_QUOTE");
  });
});

describe("checkout validation", () => {
  it("rejects an area outside the delivery zone", async () => {
    const c = client();
    const item = await plainItem();
    await c.post("/api/cart/lines", { itemId: item.id, qty: 1 });
    const { body: quote } = await c.post("/api/orders/quote", { payment: "COD" });

    const { status, body } = await c.post("/api/orders", {
      ...checkout(quote.confirmToken as string),
      areaId: "mars-colony",
      block: "Crater 9",
    });

    expect(status).toBe(400);
    expect((body.error as { code: string }).code).toBe("OUT_OF_ZONE");
  });

  it("rejects a block that does not belong to the chosen area", async () => {
    const c = client();
    const item = await plainItem();
    await c.post("/api/cart/lines", { itemId: item.id, qty: 1 });
    const { body: quote } = await c.post("/api/orders/quote", { payment: "COD" });

    const otherArea = LAHORE_AREAS.find((a) => a.id !== area.id && a.blocks.length > 0)!;
    const { status, body } = await c.post("/api/orders", {
      ...checkout(quote.confirmToken as string),
      block: otherArea.blocks[0], // valid block, wrong area
    });

    expect(status).toBe(400);
    expect((body.error as { code: string }).code).toBe("OUT_OF_ZONE");
  });

  it("rejects an invalid Pakistani mobile number", async () => {
    const c = client();
    const item = await plainItem();
    await c.post("/api/cart/lines", { itemId: item.id, qty: 1 });
    const { body: quote } = await c.post("/api/orders/quote", { payment: "COD" });

    const { status, body } = await c.post("/api/orders", {
      ...checkout(quote.confirmToken as string),
      phone: "12345",
    });

    expect(status).toBe(400);
    expect((body.error as { code: string }).code).toBe("VALIDATION");
  });

  it("refuses to quote an empty cart", async () => {
    const c = client();
    await c.get("/api/menu"); // establish a session with no cart
    const { status, body } = await c.post("/api/orders/quote", { payment: "COD" });

    expect(status).toBe(400);
    expect((body.error as { code: string }).code).toBe("EMPTY_CART");
  });
});

describe("pricing authority", () => {
  it("prices lines from the database, ignoring anything the client sends", async () => {
    const c = client();
    const item = await plainItem();

    // unitPrice/lineTotal are not part of the schema - make sure sending them
    // cannot influence what the customer is charged
    await c.post("/api/cart/lines", { itemId: item.id, qty: 1, unitPrice: 1, lineTotal: 1 });

    const { body: cart } = await c.get("/api/cart");
    const lines = cart.lines as { unitPrice: number; lineTotal: number }[];
    expect(lines[0].unitPrice).toBe(item.basePrice);
    expect(cart.subtotal).toBe(item.basePrice);
  });

  it("rejects an unknown menu item", async () => {
    const c = client();
    const { status } = await c.post("/api/cart/lines", { itemId: "unicorn-burger", qty: 1 });
    expect(status).toBeGreaterThanOrEqual(400);
  });
});
