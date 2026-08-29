"use client";

/**
 * Live order tracking: joins the order's socket room, so status changes
 * from the admin board light up the timeline in real time.
 */
import { use, useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS, formatPKR, type OrderView, type OrderStatusName } from "@four/shared";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/sections/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ChatDock } from "@/components/chat/ChatDock";

export default function TrackPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = use(params);
  const [order, setOrder] = useState<OrderView | null>(null);
  const [notFound, setNotFound] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const num = orderNumber.toUpperCase();
    api<{ order: OrderView }>(`/api/orders/${num}`)
      .then((d) => setOrder(d.order))
      .catch(() => setNotFound(true));

    const socket = getSocket();
    socket.emit("order:watch", { orderNumber: num });
    const onStatus = ({ orderNumber: n, status, at }: { orderNumber: string; status: string; at: string }) => {
      if (n !== num) return;
      setOrder((o) => (o ? { ...o, status, events: [...o.events, { status, at }] } : o));
    };
    socket.on("order:status", onStatus);
    return () => {
      socket.off("order:status", onStatus);
    };
  }, [orderNumber]);

  const currentIndex = order ? ORDER_STATUS_FLOW.indexOf(order.status as (typeof ORDER_STATUS_FLOW)[number]) : -1;
  const cancelled = order?.status === "CANCELLED";

  return (
    <>
      <Nav />
      <main className="mx-auto min-h-[calc(100dvh-4rem)] max-w-3xl px-4 pb-24 pt-28 sm:px-6">
        {notFound ? (
          <div className="rounded-card bg-cream p-10 text-center">
            <h1 className="font-display text-3xl font-semibold text-ink">Order not found</h1>
            <p className="mt-3 text-ink-soft">Check the order number, or ask the assistant to track your latest order.</p>
          </div>
        ) : !order ? (
          <div className="h-72 animate-pulse rounded-card bg-beige-deep/60" />
        ) : (
          <div className="grid gap-6">
            <div className="rounded-card bg-cream p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink-soft">Order</p>
                  <h1 className="font-display text-3xl font-semibold text-ink">{order.orderNumber}</h1>
                  {order.etaLabel && !cancelled && order.status !== "DELIVERED" && (
                    <p className="mt-1 text-sm font-semibold text-red">Usually {order.etaLabel} to {order.areaName}</p>
                  )}
                </div>
                <span
                  className={`rounded-full px-4 py-2 text-sm font-bold ${
                    cancelled ? "bg-ink/10 text-ink-soft" : "bg-red text-cream"
                  }`}
                >
                  {ORDER_STATUS_LABELS[order.status as OrderStatusName] ?? order.status}
                </span>
              </div>

              {!cancelled && (
                <ol className="mt-8 grid gap-0">
                  {ORDER_STATUS_FLOW.map((status, i) => {
                    const done = i <= currentIndex;
                    const at = order.events.find((e) => e.status === status)?.at;
                    return (
                      <li key={status} className="relative flex gap-4 pb-8 last:pb-0">
                        {i < ORDER_STATUS_FLOW.length - 1 && (
                          <span
                            className={`absolute left-[13px] top-7 h-[calc(100%-1.25rem)] w-0.5 ${
                              i < currentIndex ? "bg-red" : "bg-ink/15"
                            }`}
                            aria-hidden
                          />
                        )}
                        <motion.span
                          initial={reduce ? false : { scale: 0.6, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: i * 0.08 }}
                          className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                            done ? "border-red bg-red text-cream" : "border-ink/20 bg-cream text-transparent"
                          }`}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path d="M4 12.5l5 5L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </motion.span>
                        <div>
                          <p className={`font-semibold ${done ? "text-ink" : "text-ink-soft"}`}>
                            {ORDER_STATUS_LABELS[status]}
                          </p>
                          {at && (
                            <p className="text-xs text-ink-soft">
                              {new Date(at).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>

            <div className="rounded-card bg-cream p-8">
              <h2 className="font-display text-xl font-semibold text-ink">Order summary</h2>
              <ul className="mt-4 grid gap-3">
                {order.lines.map((l, i) => (
                  <li key={i} className="flex items-start justify-between gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-ink">
                        {l.qty}x {l.name}
                        {l.variantLabel ? ` (${l.variantLabel})` : ""}
                      </p>
                      {l.modifiers.length > 0 && <p className="text-xs text-ink-soft">{l.modifiers.join(", ")}</p>}
                    </div>
                    <span className="font-medium text-ink">{formatPKR(l.lineTotal)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-5 grid gap-1 border-t border-ink/10 pt-4 text-sm">
                <div className="flex justify-between text-ink-soft"><dt>Subtotal</dt><dd>{formatPKR(order.subtotal)}</dd></div>
                <div className="flex justify-between text-ink-soft"><dt>Delivery</dt><dd>{order.deliveryFee === 0 ? "Free" : formatPKR(order.deliveryFee)}</dd></div>
                <div className="flex justify-between text-ink-soft"><dt>Tax</dt><dd>{formatPKR(order.tax)}</dd></div>
                <div className="flex justify-between text-base font-bold text-ink"><dt>Total ({order.payment === "COD" ? "cash" : "card"})</dt><dd>{formatPKR(order.total)}</dd></div>
              </dl>
              <p className="mt-4 text-sm text-ink-soft">
                Delivering to {order.address}, {order.block}, {order.areaName}. We&apos;ll call {order.phone} if anything comes up.
              </p>
            </div>
          </div>
        )}
      </main>
      <Footer />
      <CartDrawer />
      <ChatDock />
    </>
  );
}
