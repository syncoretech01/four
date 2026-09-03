"use client";

/**
 * Site-wide "where's my food" pill: the session's latest active order as a
 * live f-livepill, bottom-left (chat owns bottom-right), linking to the
 * tracking page. Fed by /api/orders/latest and kept live over the session's
 * order:status socket events. Dismissal is per-status in sessionStorage -
 * the moment "rider on the way" lands is exactly when it should come back.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ORDER_STATUS_LABELS, type OrderStatusName, type OrderView } from "@four/shared";
import { useReduceMotion } from "@/lib/useAnim";
import { useBottomBarVisible } from "@/lib/useBottomBar";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";

const ACTIVE: OrderStatusName[] = ["PENDING_PAYMENT", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"];
const LINGER: OrderStatusName[] = ["DELIVERED"];
const MAX_AGE_MS = 6 * 60 * 60 * 1000;
const DISMISS_KEY = "four-pill-dismissed";

// the pill is redundant or unwanted on these routes
const HIDDEN_PREFIXES = ["/track", "/admin", "/rider", "/pay", "/demo"];

export function ActiveOrderPill() {
  const pathname = usePathname();
  const reduce = useReduceMotion();
  const barVisible = useBottomBarVisible();
  const [order, setOrder] = useState<{ orderNumber: string; status: OrderStatusName } | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY));
    } catch {
      /* storage unavailable - pill just stays dismissable per render */
    }
    api<{ order: OrderView | null }>("/api/orders/latest")
      .then(({ order: o }) => {
        if (!o) return;
        const age = Date.now() - new Date(o.placedAt).getTime();
        const status = o.status as OrderStatusName;
        if (age < MAX_AGE_MS && ACTIVE.includes(status)) {
          setOrder({ orderNumber: o.orderNumber, status });
        }
      })
      .catch(() => {});

    const socket = getSocket();
    const onStatus = (p: { orderNumber: string; status: string }) => {
      const status = p.status as OrderStatusName;
      setOrder((cur) => {
        if (cur && cur.orderNumber !== p.orderNumber) return cur;
        if (ACTIVE.includes(status) || LINGER.includes(status)) return { orderNumber: p.orderNumber, status };
        return null;
      });
      if (LINGER.includes(status)) {
        // "Delivered - enjoy!" lingers for a beat, then leaves
        setTimeout(() => setOrder((cur) => (cur?.orderNumber === p.orderNumber ? null : cur)), 5000);
      }
    };
    socket.on("order:status", onStatus);
    return () => {
      socket.off("order:status", onStatus);
    };
  }, []);

  if (!order) return null;
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  const dismissKey = `${order.orderNumber}:${order.status}`;
  const show = dismissed !== dismissKey;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={reduce ? false : { y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className={`fixed left-4 z-40 ${barVisible ? "bottom-24 lg:bottom-5" : "bottom-5"}`}
        >
          <span className="f-livepill gap-2 pr-1.5">
            <Link
              href={`/track/${order.orderNumber}`}
              className="flex items-center gap-2.5 text-ink-900"
              role="status"
            >
              <span className={`f-dot ${order.status === "OUT_FOR_DELIVERY" ? "" : "f-dot--off"}`} aria-hidden>
                {order.status === "OUT_FOR_DELIVERY" && <span className="f-dot__ping" />}
                <span className="f-dot__core" />
              </span>
              {order.orderNumber} · {ORDER_STATUS_LABELS[order.status]}
            </Link>
            <button
              onClick={() => {
                setDismissed(dismissKey);
                try {
                  sessionStorage.setItem(DISMISS_KEY, dismissKey);
                } catch {
                  /* fine - dismissal just won't survive a reload */
                }
              }}
              aria-label="Dismiss order status"
              className="f-iconbtn f-iconbtn--plain h-6 w-6"
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
