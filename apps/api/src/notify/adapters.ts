/**
 * Customer messaging bridge, mirroring the POS bridge's shape: one interface,
 * provider chosen by NOTIFY_PROVIDER, every account detail an env var.
 *
 * In Pakistan the channel that actually gets read is WhatsApp, so the real
 * adapter targets the WhatsApp Business (Meta Graph) API. Until FOUR has a
 * WhatsApp Business account, `console` keeps the pipeline visible in logs and
 * `webhook` bridges to anything (n8n, a local SMS gateway, a WhatsApp bot).
 *
 * Messages are best-effort by design: a failed notification must never fail
 * the order it describes. notifyService catches and logs every error.
 */
import { config } from "../config.js";

export interface NotifyResult {
  ok: boolean;
  error?: string;
}

export interface NotifyAdapter {
  name: string;
  /** `to` is a local Pakistani mobile, 03xxxxxxxxx. */
  send(to: string, text: string): Promise<NotifyResult>;
}

/** 03xxxxxxxxx -> 923xxxxxxxxx, the E.164-without-plus form Meta expects. */
export function intlPhone(local: string): string {
  return local.startsWith("0") ? `92${local.slice(1)}` : local.replace(/^\+/, "");
}

const consoleAdapter: NotifyAdapter = {
  name: "console",
  async send(to, text) {
    console.log(`[notify:console] to ${to}: ${text}`);
    return { ok: true };
  },
};

/** POSTs {to, text} anywhere - n8n/Zapier, an SMS gateway bridge, a WhatsApp bot. */
const webhookAdapter: NotifyAdapter = {
  name: "webhook",
  async send(to, text) {
    if (!config.NOTIFY_WEBHOOK_URL) return { ok: false, error: "NOTIFY_WEBHOOK_URL is not configured" };
    const res = await fetch(config.NOTIFY_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.NOTIFY_WEBHOOK_TOKEN ? { Authorization: `Bearer ${config.NOTIFY_WEBHOOK_TOKEN}` } : {}),
      },
      body: JSON.stringify({ to, text }),
    });
    return res.ok ? { ok: true } : { ok: false, error: `notify webhook responded ${res.status}` };
  },
};

/**
 * WhatsApp Business via the Meta Graph API. Needs a WhatsApp Business account:
 * WHATSAPP_TOKEN (system-user token) and WHATSAPP_PHONE_ID (the business
 * number's phone-number-id from the Meta developer console).
 *
 * Free-form text like this only reaches customers inside the 24h service
 * window a customer opens by messaging first; outside it, WhatsApp requires
 * pre-approved template messages. Order updates triggered by the customer's
 * own checkout generally qualify once the templates are approved - set the
 * templates up in Meta Business Manager before launch.
 */
const whatsappAdapter: NotifyAdapter = {
  name: "whatsapp",
  async send(to, text) {
    if (!config.WHATSAPP_TOKEN || !config.WHATSAPP_PHONE_ID) {
      return { ok: false, error: "WHATSAPP_TOKEN / WHATSAPP_PHONE_ID not configured" };
    }
    const res = await fetch(`https://graph.facebook.com/v20.0/${config.WHATSAPP_PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.WHATSAPP_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: intlPhone(to),
        type: "text",
        text: { body: text },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `WhatsApp API responded ${res.status}: ${body.slice(0, 200)}` };
    }
    return { ok: true };
  },
};

const ADAPTERS: Record<string, NotifyAdapter> = {
  console: consoleAdapter,
  webhook: webhookAdapter,
  whatsapp: whatsappAdapter,
};

export function activeNotifyAdapter(): NotifyAdapter {
  return ADAPTERS[config.NOTIFY_PROVIDER] ?? consoleAdapter;
}
