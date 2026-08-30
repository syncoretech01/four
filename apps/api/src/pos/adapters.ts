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
 * Demo: accepts every order and keeps the exact payload that a real POS would
 * have received, so the integration can be shown to a POS vendor before any
 * integration exists - "this is the JSON we would POST to you".
 *
 * In memory and capped, because it is a demonstration aid, not a record. The
 * order itself is already durable in Postgres.
 */
const DEMO_FEED_LIMIT = 25;
const demoFeed: { receivedAt: string; order: PosOrder }[] = [];

export function demoPosFeed(): { receivedAt: string; order: PosOrder }[] {
  return [...demoFeed];
}

export const demoAdapter: PosAdapter = {
  name: "demo",
  async submitOrder(order: PosOrder): Promise<PosResult> {
    demoFeed.unshift({ receivedAt: new Date().toISOString(), order });
    demoFeed.length = Math.min(demoFeed.length, DEMO_FEED_LIMIT);
    return { ok: true, posReference: `DEMO-${order.orderNumber}` };
  },
};

/**
 * Corn POS (https://www.cornpos.com) - FOUR's confirmed till system.
 *
 * Corn POS is a Lahore cloud POS (KDS, online-order intake, rider app) with
 * no public developer docs; integrations are arranged by their team
 * (info@cornpos.com, +92 42 35972044). This adapter is therefore built to
 * the shape those intakes take - an HTTPS endpoint plus an issued key -
 * with every account-specific detail an env var, so going live once they
 * hand over credentials is configuration, not code:
 *
 *   POS_PROVIDER=cornpos
 *   CORNPOS_API_URL=<order-intake endpoint from Corn POS support>
 *   CORNPOS_API_KEY=<key they issue>
 *   CORNPOS_BRANCH_MAP=fairways-dha6:1,allama-iqbal-town:2,lake-city:3
 *
 * The branch map translates our branch ids into Corn POS outlet ids so each
 * order lands on the till/KDS of the branch that cooks it. The key is sent
 * both ways vendors commonly expect it (x-api-key and a bearer token);
 * see docs/POS-INTEGRATION.md for what to confirm with their support.
 */
export function parseBranchMap(raw: string | undefined): Record<string, string> {
  const map: Record<string, string> = {};
  for (const pair of (raw ?? "").split(",")) {
    const [ours, theirs] = pair.split(":").map((s) => s.trim());
    if (ours && theirs) map[ours] = theirs;
  }
  return map;
}

export const cornposAdapter: PosAdapter = {
  name: "cornpos",
  async submitOrder(order: PosOrder): Promise<PosResult> {
    if (!config.CORNPOS_API_URL || !config.CORNPOS_API_KEY) {
      return { ok: false, error: "CORNPOS_API_URL / CORNPOS_API_KEY not configured - request them from Corn POS support" };
    }
    const outletId = parseBranchMap(config.CORNPOS_BRANCH_MAP)[order.branch?.id ?? ""];
    const res = await fetch(config.CORNPOS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.CORNPOS_API_KEY,
        Authorization: `Bearer ${config.CORNPOS_API_KEY}`,
      },
      body: JSON.stringify({ ...order, outletId }),
    });
    if (!res.ok) return { ok: false, error: `Corn POS responded ${res.status}` };
    // whatever reference their intake returns, keep it next to the order
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const ref = [body.reference, body.orderId, body.order_id, body.id].find((v) => typeof v === "string" || typeof v === "number");
    return { ok: true, posReference: ref !== undefined ? String(ref) : order.orderNumber };
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
  demo: demoAdapter,
  webhook: webhookAdapter,
  cornpos: cornposAdapter,
  foodics: foodicsAdapter,
};

export function activePosAdapter(): PosAdapter {
  return ADAPTERS[config.POS_PROVIDER] ?? consoleAdapter;
}
