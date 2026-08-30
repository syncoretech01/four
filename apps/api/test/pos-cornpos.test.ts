/**
 * Corn POS adapter, exercised against a stubbed fetch: the vendor has no
 * public sandbox, so what we can and must prove is that the adapter sends
 * exactly what their team will receive (endpoint, auth headers, outlet
 * routing) and fails loudly - never silently - when misconfigured or down.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cornposAdapter, parseBranchMap } from "../src/pos/adapters.js";
import { config } from "../src/config.js";
import type { PosOrder } from "../src/pos/types.js";

const order: PosOrder = {
  orderNumber: "FOUR-123456",
  placedAt: "2026-08-30T15:00:00.000Z",
  branch: { id: "allama-iqbal-town", name: "Iqbal Town" },
  customer: { name: "Test Customer", phone: "03001234567" },
  delivery: { areaId: "allama-iqbal-town", areaName: "Allama Iqbal Town", block: "Ravi Block", address: "House 9" },
  payment: "COD",
  lines: [{ itemId: "classic-new-york", name: "Classic New York", modifiers: [], qty: 1, unitPrice: 999 }],
  subtotal: 999,
  deliveryFee: 149,
  tax: 160,
  total: 1308,
  source: "web",
};

describe("parseBranchMap", () => {
  it("parses the documented format, tolerating spaces and junk entries", () => {
    expect(parseBranchMap("fairways-dha6:1, allama-iqbal-town : 2,lake-city:3,,broken")).toEqual({
      "fairways-dha6": "1",
      "allama-iqbal-town": "2",
      "lake-city": "3",
    });
    expect(parseBranchMap(undefined)).toEqual({});
  });
});

describe("cornpos adapter", () => {
  const saved = {
    url: config.CORNPOS_API_URL,
    key: config.CORNPOS_API_KEY,
    map: config.CORNPOS_BRANCH_MAP,
  };

  beforeEach(() => {
    config.CORNPOS_API_URL = "https://pos.example.test/orders";
    config.CORNPOS_API_KEY = "test-key";
    config.CORNPOS_BRANCH_MAP = "fairways-dha6:1,allama-iqbal-town:2,lake-city:3";
  });

  afterEach(() => {
    config.CORNPOS_API_URL = saved.url;
    config.CORNPOS_API_KEY = saved.key;
    config.CORNPOS_BRANCH_MAP = saved.map;
    vi.unstubAllGlobals();
  });

  it("refuses to pretend when credentials are missing", async () => {
    config.CORNPOS_API_URL = undefined;
    const result = await cornposAdapter.submitOrder(order);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/CORNPOS_API_URL/);
  });

  it("POSTs the order with both auth headers and the mapped outlet id", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ reference: "CP-778" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await cornposAdapter.submitOrder(order);
    expect(result).toEqual({ ok: true, posReference: "CP-778" });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://pos.example.test/orders");
    expect((init.headers as Record<string, string>)["x-api-key"]).toBe("test-key");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer test-key");
    const body = JSON.parse(init.body as string);
    expect(body.outletId).toBe("2"); // allama-iqbal-town per the branch map
    expect(body.orderNumber).toBe("FOUR-123456");
    expect(body.total).toBe(1308);
  });

  it("falls back to our order number when their intake returns no reference", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("accepted", { status: 200 })));
    const result = await cornposAdapter.submitOrder(order);
    expect(result).toEqual({ ok: true, posReference: "FOUR-123456" });
  });

  it("surfaces an HTTP failure so the order is cancelled loudly, not lost", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 503 })));
    const result = await cornposAdapter.submitOrder(order);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/503/);
  });
});
