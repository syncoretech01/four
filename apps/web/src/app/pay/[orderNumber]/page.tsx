"use client";

/**
 * Built-in demo payment gateway. Exists to prove the online-payment rail
 * end-to-end (order held as PENDING_PAYMENT until paid, kitchen only told
 * after); a real gateway (Safepay/PayFast) replaces this page with their
 * hosted checkout and confirms via webhook instead.
 */
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatPKR, type OrderView } from "@four/shared";
import { api, ApiError } from "@/lib/api";

export default function PayPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderView | null>(null);
  const [token, setToken] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "paying" | "done" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("t") ?? "");
    api<{ order: OrderView }>(`/api/orders/${orderNumber}`)
      .then(({ order }) => {
        setOrder(order);
        setState(order.status === "PENDING_PAYMENT" ? "ready" : "done");
      })
      .catch(() => {
        setMessage("Order not found.");
        setState("error");
      });
  }, [orderNumber]);

  const pay = async () => {
    setState("paying");
    try {
      await api(`/api/payments/demo/confirm`, {
        method: "POST",
        body: JSON.stringify({ orderNumber, token }),
      });
      setState("done");
      setTimeout(() => router.push(`/track/${orderNumber}`), 900);
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : "Payment failed - please try again.");
      setState("ready");
    }
  };

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-white px-4">
      <div className="f-card f-card--pad-lg w-full max-w-md">
        <p className="f-field__label">Demo payment gateway</p>
        <h1 className="f-heading f-heading--md mt-2">Complete your payment</h1>

        {state === "loading" && <p className="mt-6 text-ink-600">Loading order...</p>}

        {state === "error" && (
          <p role="alert" className="f-notice f-notice--error mt-6">
            {message}
          </p>
        )}

        {order && state !== "loading" && state !== "error" && (
          <>
            <dl className="f-summary f-summary--ruled mt-6">
              <div className="f-summary__row">
                <dt>Order</dt>
                <dd className="font-semibold text-ink-900">{order.orderNumber}</dd>
              </div>
              <div className="f-summary__row">
                <dt>Deliver to</dt>
                <dd>
                  {order.block}, {order.areaName}
                </dd>
              </div>
              <div className="f-summary__row is-total">
                <dt>Amount</dt>
                <dd>{formatPKR(order.total)}</dd>
              </div>
            </dl>

            {message && state === "ready" && (
              <p role="alert" className="f-notice f-notice--error mt-6">
                {message}
              </p>
            )}

            {state === "done" ? (
              <div className="f-notice f-notice--success mt-6">
                Payment received - your order is with the kitchen. Taking you to live tracking...
              </div>
            ) : (
              <button
                onClick={pay}
                disabled={state === "paying" || !token}
                className={`f-btn f-btn--red f-btn--lg f-btn--block mt-6 ${state === "paying" ? "is-loading" : ""}`}
              >
                {state === "paying" ? "Processing..." : `Pay ${formatPKR(order.total)} (demo)`}
              </button>
            )}

            <p className="mt-4 text-center text-xs text-ink-600">
              This is FOUR&apos;s built-in demonstration gateway - no real money moves. A live Safepay or PayFast
              checkout takes this page&apos;s place at launch.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
