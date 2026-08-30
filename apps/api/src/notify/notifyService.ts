/**
 * What we say to customers, and when. Fire-and-forget: a messaging outage
 * must never break an order, so every send is caught and logged.
 */
import { formatPKR } from "@four/shared";
import { config } from "../config.js";
import { activeNotifyAdapter } from "./adapters.js";

function trackLink(orderNumber: string): string {
  return `${config.WEB_ORIGIN}/track/${orderNumber}`;
}

const TEMPLATES: Record<string, (o: { orderNumber: string; total: number }) => string> = {
  CONFIRMED: (o) =>
    `FOUR: your order ${o.orderNumber} is confirmed - ${formatPKR(o.total)}. Track it live: ${trackLink(o.orderNumber)}`,
  OUT_FOR_DELIVERY: (o) => `FOUR: your rider is on the way with ${o.orderNumber}. Watch them live: ${trackLink(o.orderNumber)}`,
  DELIVERED: (o) => `FOUR: ${o.orderNumber} delivered - enjoy! See you again soon.`,
  CANCELLED: (o) =>
    `FOUR: sorry - order ${o.orderNumber} could not be processed and has been cancelled. Nothing has been charged. Please order again or call us.`,
};

export function notifyOrderStatus(
  order: { orderNumber: string; phone: string; total: number },
  status: string,
): void {
  const template = TEMPLATES[status];
  if (!template) return; // PREPARING etc. would just be noise on the phone
  sendToCustomer(order.phone, template(order));
}

export function sendToCustomer(phone: string, text: string): void {
  const adapter = activeNotifyAdapter();
  void adapter
    .send(phone, text)
    .then((r) => {
      if (!r.ok) console.error(`[notify:${adapter.name}] send failed: ${r.error}`);
    })
    .catch((e) => console.error(`[notify:${adapter.name}] send threw:`, e instanceof Error ? e.message : e));
}

/** OTP delivery is awaited (the user is waiting at the form), unlike status pings. */
export async function sendLoginCode(phone: string, code: string): Promise<boolean> {
  const adapter = activeNotifyAdapter();
  try {
    const r = await adapter.send(phone, `FOUR: your sign-in code is ${code}. It expires in 5 minutes.`);
    if (!r.ok) console.error(`[notify:${adapter.name}] login code send failed: ${r.error}`);
    return r.ok;
  } catch (e) {
    console.error(`[notify:${adapter.name}] login code send threw:`, e instanceof Error ? e.message : e);
    return false;
  }
}
