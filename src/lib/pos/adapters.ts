import type { PosAdapter, PosOrder, PosResult } from "./types";

/**
 * Console adapter (default): accepts the order and logs it server-side.
 * Keeps the full checkout flow working end-to-end before the real POS is
 * wired up; the kitchen can be notified via the webhook adapter meanwhile.
 */
export const consoleAdapter: PosAdapter = {
  name: "console",
  async submitOrder(order: PosOrder): Promise<PosResult> {
    console.log("[POS:console] order received", JSON.stringify(order, null, 2));
    return { ok: true, posReference: order.orderNumber };
  },
};

/**
 * Generic webhook adapter: POSTs the order JSON to POS_WEBHOOK_URL with an
 * optional bearer token. Works today with Zapier/Make/n8n, a Google Sheet
 * bridge, a WhatsApp business bot, or a thin middleware in front of any
 * POS that exposes an API.
 */
export const webhookAdapter: PosAdapter = {
  name: "webhook",
  async submitOrder(order: PosOrder): Promise<PosResult> {
    const url = process.env.POS_WEBHOOK_URL;
    if (!url) return { ok: false, error: "POS_WEBHOOK_URL is not configured" };
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.POS_WEBHOOK_TOKEN ? { Authorization: `Bearer ${process.env.POS_WEBHOOK_TOKEN}` } : {}),
      },
      body: JSON.stringify(order),
    });
    if (!res.ok) return { ok: false, error: `POS webhook responded ${res.status}` };
    return { ok: true, posReference: order.orderNumber };
  },
};

/**
 * Foodics adapter skeleton (common in Pakistani/GCC restaurant chains).
 * Fill in the branch/product ID mapping once the account is confirmed:
 * https://developers.foodics.com - POST /orders with an access token.
 */
export const foodicsAdapter: PosAdapter = {
  name: "foodics",
  async submitOrder(order: PosOrder): Promise<PosResult> {
    const token = process.env.FOODICS_API_TOKEN;
    const branchId = process.env.FOODICS_BRANCH_ID;
    if (!token || !branchId) return { ok: false, error: "FOODICS_API_TOKEN / FOODICS_BRANCH_ID not configured" };
    // Requires a menu-item mapping table (our itemId -> Foodics product id)
    // maintained in the Foodics console. Left as the integration step in
    // docs/POS-INTEGRATION.md until the client confirms their POS.
    return { ok: false, error: "Foodics product mapping not configured yet" };
  },
};

const ADAPTERS: Record<string, PosAdapter> = {
  console: consoleAdapter,
  webhook: webhookAdapter,
  foodics: foodicsAdapter,
};

export function activeAdapter(): PosAdapter {
  const key = process.env.POS_PROVIDER ?? "console";
  return ADAPTERS[key] ?? consoleAdapter;
}
