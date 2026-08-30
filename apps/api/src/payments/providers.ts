/**
 * Online payment bridge, same architecture as the POS bridge: one interface,
 * provider chosen by PAYMENT_PROVIDER, every account detail an env var.
 *
 * "none" (default) keeps card orders as pay-at-the-door: the rider brings a
 * card machine, tax is still the card rate. Everything else runs the full
 * rail: order is created PENDING_PAYMENT, the customer is sent to the
 * gateway, and a confirm (webhook or redirect-back) flips it CONFIRMED and
 * releases it to the kitchen. The POS never sees an unpaid card order.
 *
 * Real Pakistani gateways (both need a merchant account from FOUR):
 * - Safepay (getsafepay.com) - developer-friendly, hosted checkout, sandbox.
 * - PayFast (gopayfast.com)  - banks + Easypaisa/JazzCash wallets.
 * The skeletons fail loudly until credentials arrive, like the POS adapters.
 */
import { createHmac } from "node:crypto";
import { config } from "../config.js";

export interface PaymentInit {
  ok: boolean;
  /** Where the customer completes payment. Absent = nothing to pay online. */
  redirectUrl?: string;
  /** The gateway's id for this payment attempt. */
  paymentRef?: string;
  error?: string;
}

export interface PaymentProvider {
  name: string;
  createPayment(order: {
    orderNumber: string;
    total: number;
    customerName: string;
    phone: string;
  }): Promise<PaymentInit>;
}

/**
 * Signs the demo gateway's confirm call so the pay page cannot be skipped by
 * guessing an order number. Real gateways replace this with their webhook
 * signature verification.
 */
export function demoPaymentToken(orderNumber: string): string {
  return createHmac("sha256", config.APP_SECRET).update(`demo-pay:${orderNumber}`).digest("base64url");
}

const noneProvider: PaymentProvider = {
  name: "none",
  async createPayment() {
    return { ok: true }; // card machine at the door; nothing to collect online
  },
};

/** Built-in gateway page at /pay/<order> - proves the rail end-to-end. */
const demoProvider: PaymentProvider = {
  name: "demo",
  async createPayment(order) {
    return {
      ok: true,
      redirectUrl: `${config.WEB_ORIGIN}/pay/${order.orderNumber}?t=${demoPaymentToken(order.orderNumber)}`,
      paymentRef: `DEMOPAY-${order.orderNumber}`,
    };
  },
};

/**
 * Safepay skeleton. To finish: POST /order/v1/init with SAFEPAY_API_KEY to
 * mint a tracker token, redirect to their hosted checkout with it, then
 * verify the webhook HMAC with SAFEPAY_SECRET in routes/payments.ts.
 */
const safepayProvider: PaymentProvider = {
  name: "safepay",
  async createPayment() {
    if (!config.SAFEPAY_API_KEY || !config.SAFEPAY_SECRET) {
      return { ok: false, error: "SAFEPAY_API_KEY / SAFEPAY_SECRET not configured" };
    }
    return { ok: false, error: "Safepay checkout not implemented yet - needs FOUR's merchant account to test against" };
  },
};

/**
 * PayFast (Pakistan) skeleton. To finish: fetch an access token with
 * PAYFAST_MERCHANT_ID + PAYFAST_SECURED_KEY, then redirect to their hosted
 * checkout; their IPN callback confirms in routes/payments.ts.
 */
const payfastProvider: PaymentProvider = {
  name: "payfast",
  async createPayment() {
    if (!config.PAYFAST_MERCHANT_ID || !config.PAYFAST_SECURED_KEY) {
      return { ok: false, error: "PAYFAST_MERCHANT_ID / PAYFAST_SECURED_KEY not configured" };
    }
    return { ok: false, error: "PayFast checkout not implemented yet - needs FOUR's merchant account to test against" };
  },
};

const PROVIDERS: Record<string, PaymentProvider> = {
  none: noneProvider,
  demo: demoProvider,
  safepay: safepayProvider,
  payfast: payfastProvider,
};

export function activePaymentProvider(): PaymentProvider {
  return PROVIDERS[config.PAYMENT_PROVIDER] ?? noneProvider;
}
