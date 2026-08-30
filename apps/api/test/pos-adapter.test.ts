/**
 * The demo adapter itself, exercised directly so the capture behaviour is
 * covered without needing POS_PROVIDER=demo for the whole suite.
 */
import { describe, expect, it } from "vitest";
import { demoAdapter, demoPosFeed } from "../src/pos/adapters.js";
import type { PosOrder } from "../src/pos/types.js";

describe("demo POS adapter", () => {
  it("starts empty and returns a copy, not the live array", () => {
    const a = demoPosFeed();
    const b = demoPosFeed();
    expect(a).toEqual([]);
    expect(a).not.toBe(b); // callers must not be able to mutate the feed
  });
});

const order: PosOrder = {
  orderNumber: "FOUR-123456",
  placedAt: "2026-08-20T15:00:00.000Z",
  customer: { name: "Demo Customer", phone: "03001234567" },
  delivery: { areaId: "dha-phase-1", areaName: "DHA Phase 1", block: "Block A", address: "House 12" },
  payment: "COD",
  lines: [{ itemId: "classic-new-york", name: "Classic New York", modifiers: [], qty: 2, unitPrice: 999 }],
  subtotal: 1998,
  deliveryFee: 149,
  tax: 320,
  total: 2467,
  source: "web",
};

describe("demo adapter capture", () => {
  it("accepts the order and keeps the payload verbatim", async () => {
    const result = await demoAdapter.submitOrder(order);
    expect(result.ok).toBe(true);
    expect(result.ok && result.posReference).toBe("DEMO-FOUR-123456");

    const feed = demoPosFeed();
    expect(feed[0].order).toEqual(order); // verbatim: this is the point of the feed
    expect(feed[0].receivedAt).toBeTruthy();
  });

  it("puts the newest order first", async () => {
    await demoAdapter.submitOrder({ ...order, orderNumber: "FOUR-999999" });
    expect(demoPosFeed()[0].order.orderNumber).toBe("FOUR-999999");
  });
});
