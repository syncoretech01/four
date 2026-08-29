import { config } from "../config.js";
import type { PosAdapter, PosOrder, PosResult } from "./types.js";

/** Default: accept and log. Keeps checkout working end-to-end before the live POS is known. */
const consoleAdapter: PosAdapter = {
  name: "console",
  async submitOrder(order: PosOrder): Promise<PosResult> {
    console.log("[POS:console] order received", JSON.stringify(order));
    return { ok: true, posReference: order.orderNumber };
  },
};

/**
 * Generic webhook: POSTs the order JSON to POS_WEBHOOK_URL with an optional
 * bearer token. Works today with Zapier/Make/n8n, a WhatsApp business bot,
 * or thin middleware in front of any POS with an API.
 */
const webhookAdapter: PosAdapter = {
  name: "webhook",
  async submitOrder(order: PosOrder): Promise<PosResult> {
    if (!config.POS_WEBHOOK_URL) return { ok: false, error: "POS_WEBHOOK_URL is not configured" };
    const res = await fetch(config.POS_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.POS_WEBHOOK_TOKEN ? { Authorization: `Bearer ${config.POS_WEBHOOK_TOKEN}` } : {}),
      },
      body: JSON.stringify(order),
    });
    if (!res.ok) return { ok: false, error: `POS webhook responded ${res.status}` };
    return { ok: true, posReference: order.orderNumber };
  },
};

/**
 * Foodics skeleton (https://developers.foodics.com): needs the account's
 * product-id mapping before it can be completed - see docs/POS-INTEGRATION.md.
 */
const foodicsAdapter: PosAdapter = {
  name: "foodics",
  async submitOrder(): Promise<PosResult> {
    if (!config.FOODICS_API_TOKEN || !config.FOODICS_BRANCH_ID) {
      return { ok: false, error: "FOODICS_API_TOKEN / FOODICS_BRANCH_ID not configured" };
    }
    return { ok: false, error: "Foodics product mapping not configured yet" };
  },
};

const ADAPTERS: Record<string, PosAdapter> = {
  console: consoleAdapter,
  webhook: webhookAdapter,
  foodics: foodicsAdapter,
};

export function activePosAdapter(): PosAdapter {
  return ADAPTERS[config.POS_PROVIDER] ?? consoleAdapter;
}
