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
    <main className="flex min-h-screen items-center justify-center bg-beige px-4">
      <div className="w-full max-w-md rounded-[20px] bg-cream p-8 border border-rule">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-red">Demo payment gateway</p>
        <h1 className="mt-2 text-2xl font-bold text-ink-900">Complete your payment</h1>

        {state === "loading" && <p className="mt-6 text-ink-600">Loading order...</p>}

        {state === "error" && (
          <p role="alert" className="f-notice f-notice--error mt-6">
            {message}
          </p>
        )}

        {order && state !== "loading" && state !== "error" && (
          <>
            <dl className="mt-6 grid gap-2 rounded-[20px] bg-beige/60 p-4 text-sm">
              <div className="flex justify-between text-ink-600">
                <dt>Order</dt>
                <dd className="font-semibold text-ink-900">{order.orderNumber}</dd>
              </div>
              <div className="flex justify-between text-ink-600">
                <dt>Deliver to</dt>
                <dd>
                  {order.block}, {order.areaName}
                </dd>
              </div>
              <div className="flex justify-between text-base font-bold text-ink-900">
                <dt>Amount</dt>
                <dd>{formatPKR(order.total)}</dd>
              </div>
            </dl>

            {message && state === "ready" && (
              <p role="alert" className="f-notice f-notice--error mt-4">
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
                className="f-btn f-btn--red f-btn--md f-btn--block mt-6"
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
