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
      <div className="w-full max-w-md rounded-3xl bg-cream p-8 shadow-xl shadow-ink/10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-red">Demo payment gateway</p>
        <h1 className="mt-2 text-2xl font-bold text-ink">Complete your payment</h1>

        {state === "loading" && <p className="mt-6 text-ink-soft">Loading order...</p>}

        {state === "error" && (
          <p role="alert" className="mt-6 rounded-xl bg-red/10 px-4 py-3 text-sm font-medium text-red">
            {message}
          </p>
        )}

        {order && state !== "loading" && state !== "error" && (
          <>
            <dl className="mt-6 grid gap-2 rounded-2xl bg-beige/60 p-4 text-sm">
              <div className="flex justify-between text-ink-soft">
                <dt>Order</dt>
                <dd className="font-semibold text-ink">{order.orderNumber}</dd>
              </div>
              <div className="flex justify-between text-ink-soft">
                <dt>Deliver to</dt>
                <dd>
                  {order.block}, {order.areaName}
                </dd>
              </div>
              <div className="flex justify-between text-base font-bold text-ink">
                <dt>Amount</dt>
                <dd>{formatPKR(order.total)}</dd>
              </div>
            </dl>

            {message && state === "ready" && (
              <p role="alert" className="mt-4 rounded-xl bg-red/10 px-4 py-3 text-sm font-medium text-red">
                {message}
              </p>
            )}

            {state === "done" ? (
              <div className="mt-6 rounded-xl bg-green-700/10 px-4 py-3 text-sm font-semibold text-green-800">
                Payment received - your order is with the kitchen. Taking you to live tracking...
              </div>
            ) : (
              <button
                onClick={pay}
                disabled={state === "paying" || !token}
                className="mt-6 w-full rounded-full bg-red py-4 text-base font-semibold text-cream transition hover:bg-red-deep active:scale-[0.98] disabled:opacity-50"
              >
                {state === "paying" ? "Processing..." : `Pay ${formatPKR(order.total)} (demo)`}
              </button>
            )}

            <p className="mt-4 text-center text-xs text-ink-soft">
              This is FOUR&apos;s built-in demonstration gateway - no real money moves. A live Safepay or PayFast
              checkout takes this page&apos;s place at launch.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
