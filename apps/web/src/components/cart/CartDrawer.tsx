"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { formatPKR, FREE_DELIVERY_ABOVE } from "@four/shared";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import { CheckoutForm } from "./CheckoutForm";

export function CartDrawer() {
  const open = useStore((s) => s.cartOpen);
  const setOpen = useStore((s) => s.setCartOpen);
  const cart = useStore((s) => s.cart);
  const checkoutOpen = useStore((s) => s.checkoutOpen);
  const openCheckout = useStore((s) => s.openCheckout);
  const closeCheckout = useStore((s) => s.closeCheckout);
  const reduce = useReducedMotion();

  const close = () => setOpen(false);

  const setQty = (lineId: string, qty: number) => {
    api("/api/cart/lines", { method: "PATCH", body: JSON.stringify({ lineId, qty }) }).catch(() => {});
  };

  const startCheckout = async () => {
    try {
      const quote = await api<import("@four/shared").OrderQuote>("/api/orders/quote", {
        method: "POST",
        body: JSON.stringify({ payment: "COD" }),
      });
      openCheckout(quote);
    } catch {
      /* cart emptied under us; drawer already reflects it */
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={close} aria-hidden />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Your order"
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-cream shadow-2xl"
            initial={reduce ? false : { x: "100%" }}
            animate={{ x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
          >
            <header className="flex items-center justify-between border-b border-ink/10 p-6">
              <h2 className="font-display text-2xl font-semibold text-ink">{checkoutOpen ? "Checkout" : "Your Order"}</h2>
              <button
                onClick={close}
                aria-label="Close cart"
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition hover:bg-beige-deep hover:text-ink active:scale-95"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </header>

            {checkoutOpen ? (
              <CheckoutForm onBack={closeCheckout} onDone={close} />
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-6">
                  {cart.lines.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                      <span className="font-display text-4xl font-semibold text-ink/10">Empty!</span>
                      <p className="max-w-[26ch] text-ink-soft">
                        Nothing here yet. Browse the menu, or tell the assistant what you&apos;re craving.
                      </p>
                      <a
                        href="#menu"
                        onClick={close}
                        className="rounded-full bg-red px-6 py-3 text-sm font-semibold text-cream transition hover:bg-red-deep"
                      >
                        See the menu
                      </a>
                    </div>
                  ) : (
                    <ul className="grid gap-5">
                      {cart.lines.map((l) => (
                        <li key={l.lineId} className="flex items-start gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-ink">
                              {l.name}
                              {l.variantLabel ? ` (${l.variantLabel})` : ""}
                            </p>
                            {l.modifiers.length > 0 && (
                              <p className="truncate text-xs text-ink-soft">
                                {l.modifiers.map((m) => (m.qty > 1 ? `${m.label} x${m.qty}` : m.label)).join(", ")}
                              </p>
                            )}
                            <p className="text-sm text-ink-soft">{formatPKR(l.unitPrice)} each</p>
                          </div>
                          <div className="flex items-center rounded-full border border-ink/15">
                            <button
                              onClick={() => setQty(l.lineId, l.qty - 1)}
                              aria-label={`Remove one ${l.name}`}
                              className="flex h-9 w-9 items-center justify-center font-bold text-ink transition hover:text-red active:scale-90"
                            >
                              -
                            </button>
                            <span className="w-6 text-center text-sm font-bold">{l.qty}</span>
                            <button
                              onClick={() => setQty(l.lineId, l.qty + 1)}
                              aria-label={`Add one ${l.name}`}
                              className="flex h-9 w-9 items-center justify-center font-bold text-ink transition hover:text-red active:scale-90"
                            >
                              +
                            </button>
                          </div>
                          <span className="w-20 shrink-0 text-right text-sm font-bold text-ink">{formatPKR(l.lineTotal)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {cart.lines.length > 0 && (
                  <footer className="border-t border-ink/10 p-6">
                    <dl className="grid gap-1.5 text-sm">
                      <div className="flex justify-between text-ink-soft">
                        <dt>Subtotal</dt>
                        <dd>{formatPKR(cart.subtotal)}</dd>
                      </div>
                      <p className="text-xs text-ink-soft">
                        {cart.subtotal >= FREE_DELIVERY_ABOVE
                          ? "Free delivery unlocked."
                          : `Delivery and tax are added at checkout - free delivery above ${formatPKR(FREE_DELIVERY_ABOVE)}.`}
                      </p>
                    </dl>
                    <button
                      onClick={startCheckout}
                      className="mt-5 w-full rounded-full bg-red py-4 text-base font-semibold text-cream transition hover:bg-red-deep active:scale-[0.98]"
                    >
                      Checkout · {cart.itemCount} item{cart.itemCount === 1 ? "" : "s"}
                    </button>
                  </footer>
                )}
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
