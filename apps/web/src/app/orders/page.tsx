"use client";

/**
 * Order history for the customer account that guest checkout creates
 * implicitly (phone = identity, linked to this browser's session).
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { ORDER_STATUS_LABELS, formatPKR, type OrderView, type OrderStatusName } from "@four/shared";
import { api } from "@/lib/api";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/sections/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ChatDock } from "@/components/chat/ChatDock";

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderView[] | null>(null);

  useEffect(() => {
    api<{ orders: OrderView[] }>("/api/orders/mine")
      .then((d) => setOrders(d.orders))
      .catch(() => setOrders([]));
  }, []);

  return (
    <>
      <Nav />
      <main className="mx-auto min-h-[calc(100dvh-4rem)] max-w-3xl px-4 pb-24 pt-28 sm:px-6">
        <h1 className="font-display text-4xl font-semibold text-ink">Your orders</h1>
        <p className="mt-2 text-ink-soft">Everything you have ordered from this device or phone number.</p>

        <div className="mt-8 grid gap-4">
          {orders === null && <div className="h-40 animate-pulse rounded-card bg-beige-deep/60" />}
          {orders?.length === 0 && (
            <div className="rounded-card bg-cream p-10 text-center">
              <p className="text-ink-soft">No orders yet. Your first one is a scroll away.</p>
              <Link
                href="/#menu"
                className="mt-4 inline-block rounded-full bg-red px-6 py-3 text-sm font-semibold text-cream transition hover:bg-red-deep"
              >
                See the menu
              </Link>
            </div>
          )}
          {orders?.map((o) => (
            <Link
              key={o.orderNumber}
              href={`/track/${o.orderNumber}`}
              className="group rounded-card bg-cream p-6 transition hover:shadow-lg hover:shadow-ink/10"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display text-xl font-semibold text-ink group-hover:text-red">{o.orderNumber}</p>
                  <p className="text-sm text-ink-soft">
                    {new Date(o.placedAt).toLocaleDateString("en-PK", { day: "numeric", month: "short" })} ·{" "}
                    {o.lines.reduce((n, l) => n + l.qty, 0)} items · {o.branchName ?? "FOUR"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                      o.status === "CANCELLED" ? "bg-ink/10 text-ink-soft" : o.status === "DELIVERED" ? "bg-ink/10 text-ink" : "bg-red text-cream"
                    }`}
                  >
                    {ORDER_STATUS_LABELS[o.status as OrderStatusName] ?? o.status}
                  </span>
                  <span className="font-bold text-ink">{formatPKR(o.total)}</span>
                </div>
              </div>
              <p className="mt-3 truncate text-sm text-ink-soft">
                {o.lines.map((l) => `${l.qty}x ${l.name}`).join(", ")}
              </p>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
      <CartDrawer />
      <ChatDock />
    </>
  );
}
