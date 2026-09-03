"use client";

/**
 * Live order tracking: joins the order's socket room, so status changes from
 * the admin board and the rider's GPS light up the page in real time. Red
 * status card (the page's own title band), a timeline with a pulsing live
 * node, and the branded map.
 */
import { use, useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { useReduceMotion } from "@/lib/useAnim";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS, formatPKR, BRAND, type OrderView } from "@four/shared";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { Nav } from "@/components/Nav";
import { HAND_MARK } from "@/components/hero/logoPaths";
import { DoodleBackdrop } from "@/components/ds/DoodleBackdrop";
import { StickerTag } from "@/components/ds/StickerTag";
import { PillCta } from "@/components/ds/PillCta";

const TrackMap = dynamic(() => import("@/components/map/TrackMap").then((m) => m.TrackMap), { ssr: false });
import { Footer } from "@/components/sections/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ChatDock } from "@/components/chat/ChatDock";

export default function TrackPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = use(params);
  const [order, setOrder] = useState<OrderView | null>(null);
  const [notFound, setNotFound] = useState(false);
  const reduce = useReduceMotion();

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
    const onRider = ({ orderNumber: n, riderName }: { orderNumber: string; riderName: string }) => {
      if (n === num) setOrder((o) => (o ? { ...o, riderName } : o));
    };
    socket.on("rider:assigned", onRider);
    return () => {
      socket.off("order:status", onStatus);
      socket.off("rider:assigned", onRider);
    };
  }, [orderNumber]);

  const currentIndex = order ? ORDER_STATUS_FLOW.indexOf(order.status as (typeof ORDER_STATUS_FLOW)[number]) : -1;
  const cancelled = order?.status === "CANCELLED";
  const awaitingPayment = order?.status === "PENDING_PAYMENT";
  const delivered = order?.status === "DELIVERED";
  const outForDelivery = order?.status === "OUT_FOR_DELIVERY";

  const headline = cancelled
    ? "Order cancelled"
    : awaitingPayment
      ? "Awaiting payment"
      : delivered
        ? "Delivered - enjoy!"
        : outForDelivery
          ? order?.riderName
            ? `${order.riderName} is on the way`
            : "Your rider is on the way"
          : order?.status === "PREPARING"
            ? "In the kitchen"
            : "Order confirmed";

  const stateLabel = cancelled ? "Cancelled" : delivered ? "Delivered" : outForDelivery ? "On the way" : "In the kitchen";

  return (
    <>
      <Nav />
      <main id="main" className="wrap wrap-narrow min-h-[calc(100dvh-var(--bar-h))] pb-24 pt-[calc(var(--bar-h)+2rem)]">
        {notFound ? (
          <div className="f-card p-8 text-center">
            <h1 className="f-heading f-heading--md">Order not found</h1>
            <p className="mt-3 text-ink-600">Check the order number, or ask the assistant to track your latest order.</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <PillCta href="/orders">See my orders</PillCta>
              <Link href="/menu" className="f-btn f-btn--quiet">
                Browse the menu
              </Link>
            </div>
            <p className="mt-5 text-sm text-ink-600">
              Or call us on{" "}
              <a href={BRAND.phoneHref} className="font-bold text-red">
                {BRAND.phone}
              </a>
            </p>
          </div>
        ) : !order ? (
          <div className="grid gap-6">
            <div className="h-52 animate-pulse rounded-[20px] bg-cream" />
            <div className="h-72 animate-pulse rounded-[20px] bg-cream" />
          </div>
        ) : (
          <div className="grid gap-6">
            {/* announce socket-driven status changes to screen readers */}
            <p className="sr-only" role="status">
              Order status: {headline}
            </p>
            {/* status card: the one thing the customer opened the page for (doubles as the page's title band) */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="f-card f-card--inverse relative isolate overflow-hidden p-8"
            >
              <DoodleBackdrop />
              <div className="relative z-[1] flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <StickerTag tilt="left" tone={cancelled ? "red" : "yellow"}>
                      {stateLabel}
                    </StickerTag>
                    {outForDelivery && (
                      <span className="f-dot f-dot--cream" aria-hidden>
                        <span className="f-dot__ping motion-reduce:hidden" />
                        <span className="f-dot__core" />
                      </span>
                    )}
                    <span className="text-sm font-medium text-white/70">{order.orderNumber}</span>
                  </div>
                  <h1 className="mt-4 font-display text-4xl uppercase leading-none sm:text-5xl">{headline}</h1>
                  {!cancelled && !delivered && !awaitingPayment && order.etaLabel && (
                    <p className="mt-3 text-lg font-medium text-white/85">
                      Usually {order.etaLabel} to {order.areaName}
                    </p>
                  )}
                </div>
                {/* hand mark: white on red is one of the two approved lockups */}
                <svg viewBox="180 100 700 900" aria-hidden className="h-16 w-16 shrink-0">
                  <g transform={HAND_MARK.transform}>
                    <path d={HAND_MARK.d} fill="currentColor" />
                  </g>
                </svg>
              </div>

              {awaitingPayment && (
                <div className="relative z-[1] mt-6">
                  <p className="text-white/85">Your order is reserved. The kitchen starts once payment goes through.</p>
                  {order.paymentUrl && (
                    <PillCta href={order.paymentUrl} className="mt-4">
                      Complete payment · {formatPKR(order.total)}
                    </PillCta>
                  )}
                </div>
              )}

              {cancelled && (
                <p className="relative z-[1] mt-4 text-white/80">
                  Nothing has been charged. Please order again, or call us on {BRAND.phone}.
                </p>
              )}
            </motion.div>

            {/* timeline */}
            {!cancelled && !awaitingPayment && (
              <div className="f-card p-8">
                <ol className="f-timeline">
                  {ORDER_STATUS_FLOW.map((status, i) => {
                    const done = i <= currentIndex;
                    const active = i === currentIndex && !delivered;
                    const at = order.events.find((e) => e.status === status)?.at;
                    return (
                      <li key={status} className={`f-timeline__step ${done ? "is-done" : ""}`}>
                        {i < ORDER_STATUS_FLOW.length - 1 && <span className="f-timeline__line" aria-hidden />}
                        <span className="f-timeline__node">
                          {active && <span className="f-timeline__ping motion-reduce:hidden" aria-hidden />}
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path d="M4 12.5l5 5L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        <div>
                          <p className="f-timeline__label">{ORDER_STATUS_LABELS[status]}</p>
                          {at && (
                            <p className="f-timeline__time">
                              {new Date(at).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            {/* live map */}
            {order.destLat != null && order.destLng != null && !cancelled && !awaitingPayment && !delivered && (
              <div className="f-card overflow-hidden p-8">
                <TrackMap
                  orderNumber={order.orderNumber}
                  branchId={order.branchId}
                  dest={{ lat: order.destLat, lng: order.destLng }}
                />
                <p className="pt-4 text-ink-600">
                  {outForDelivery
                    ? order.riderName
                      ? `${order.riderName} is riding to you - watch the red dot move.`
                      : "Your rider is on the way - the red dot moves live."
                    : `Cooking at ${order.branchName ?? "FOUR"}. The map goes live when your rider leaves.`}
                </p>
              </div>
            )}

            {/* summary */}
            <div className="f-card p-8">
              <h2 className="f-heading f-heading--sm">Order summary</h2>
              <ul className="mt-5 grid gap-3">
                {order.lines.map((l, i) => (
                  <li key={i} className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-ink-900">
                        {l.qty}x {l.name}
                        {l.variantLabel ? ` (${l.variantLabel})` : ""}
                      </p>
                      {l.modifiers.length > 0 && <p className="text-xs text-ink-600">{l.modifiers.join(", ")}</p>}
                    </div>
                    <span className="font-semibold text-ink-900">{formatPKR(l.lineTotal)}</span>
                  </li>
                ))}
              </ul>
              <dl className="f-summary f-summary--ruled mt-5">
                <div className="f-summary__row">
                  <dt>Subtotal</dt>
                  <dd>{formatPKR(order.subtotal)}</dd>
                </div>
                <div className="f-summary__row">
                  <dt>Delivery</dt>
                  <dd>{order.deliveryFee === 0 ? "Free" : formatPKR(order.deliveryFee)}</dd>
                </div>
                <div className="f-summary__row">
                  <dt>Tax</dt>
                  <dd>{formatPKR(order.tax)}</dd>
                </div>
                <div className="f-summary__row is-total">
                  <dt>Total ({order.payment === "COD" ? "cash" : "card"})</dt>
                  <dd>{formatPKR(order.total)}</dd>
                </div>
              </dl>
              <p className="mt-4 text-sm text-ink-600">
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
