"use client";

import { AnimatePresence, motion } from "motion/react";
import { useReduceMotion } from "@/lib/useAnim";
import { formatPKR, FREE_DELIVERY_ABOVE } from "@four/shared";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import { SmartImage } from "../SmartImage";
import { CheckoutForm } from "./CheckoutForm";
import { HAND_MARK } from "../hero/logoPaths";

export function CartDrawer() {
  const open = useStore((s) => s.cartOpen);
  const setOpen = useStore((s) => s.setCartOpen);
  const cart = useStore((s) => s.cart);
  const checkoutOpen = useStore((s) => s.checkoutOpen);
  const openCheckout = useStore((s) => s.openCheckout);
  const closeCheckout = useStore((s) => s.closeCheckout);
  const reduce = useReduceMotion();

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

  const freeIn = Math.max(0, FREE_DELIVERY_ABOVE - cart.subtotal);
  const freePct = Math.min(100, (cart.subtotal / FREE_DELIVERY_ABOVE) * 100);

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
              <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
                {checkoutOpen ? "Checkout" : "Your order"}
              </h2>
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
                    <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
                      <svg viewBox="180 100 700 900" className="h-24 w-24 text-red/20" aria-hidden>
                        <g transform={HAND_MARK.transform}>
                          <path d={HAND_MARK.d} fill="currentColor" />
                        </g>
                      </svg>
                      <p className="max-w-[26ch] text-lg font-medium text-ink-soft">
                        Nothing here yet. Browse the menu, or tell the assistant what you&apos;re craving.
                      </p>
                      <a
                        href="#menu"
                        onClick={close}
                        className="rounded-full bg-red px-7 py-3 text-sm font-bold text-cream transition hover:bg-red-deep active:scale-[0.98]"
                      >
                        See the menu
                      </a>
                    </div>
                  ) : (
                    <ul className="grid gap-4">
                      <AnimatePresence initial={false}>
                        {cart.lines.map((l) => (
                          <motion.li
                            key={l.lineId}
                            layout={!reduce}
                            initial={reduce ? false : { opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            className="flex items-start gap-3 overflow-hidden"
                          >
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-beige-deep">
                              {l.image && (
                                <SmartImage src={l.image} alt={l.name} fallbackLabel={l.name} className="h-full w-full object-cover" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-bold text-ink">
                                {l.name}
                                {l.variantLabel ? ` (${l.variantLabel})` : ""}
                              </p>
                              {l.modifiers.length > 0 && (
                                <p className="truncate text-xs text-ink-soft">
                                  {l.modifiers.map((m) => (m.qty > 1 ? `${m.label} x${m.qty}` : m.label)).join(", ")}
                                </p>
                              )}
                              <div className="mt-2 flex items-center gap-3">
                                <div className="flex items-center rounded-full border border-ink/15">
                                  <button
                                    onClick={() => setQty(l.lineId, l.qty - 1)}
                                    aria-label={`Remove one ${l.name}`}
                                    className="flex h-8 w-8 items-center justify-center font-bold text-ink transition hover:text-red active:scale-90"
                                  >
                                    -
                                  </button>
                                  <span className="w-6 text-center text-sm font-bold">{l.qty}</span>
                                  <button
                                    onClick={() => setQty(l.lineId, l.qty + 1)}
                                    aria-label={`Add one ${l.name}`}
                                    className="flex h-8 w-8 items-center justify-center font-bold text-ink transition hover:text-red active:scale-90"
                                  >
                                    +
                                  </button>
                                </div>
                                <span className="text-sm font-bold text-ink">{formatPKR(l.lineTotal)}</span>
                              </div>
                            </div>
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </ul>
                  )}
                </div>

                {cart.lines.length > 0 && (
                  <footer className="border-t border-ink/10 p-6">
                    {/* free-delivery progress: a genuine nudge, not decoration */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-ink">
                        {freeIn === 0 ? (
                          <span className="font-bold text-red">Free delivery unlocked.</span>
                        ) : (
                          <>
                            <span className="font-bold text-red">{formatPKR(freeIn)}</span> away from free delivery
                          </>
                        )}
                      </p>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-beige-deep">
                        <motion.div
                          className="h-full rounded-full bg-red"
                          initial={false}
                          animate={{ width: `${freePct}%` }}
                          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                    </div>
                    <dl className="flex items-center justify-between text-sm">
                      <dt className="text-ink-soft">Subtotal</dt>
                      <dd className="text-lg font-bold text-ink">{formatPKR(cart.subtotal)}</dd>
                    </dl>
                    <p className="mt-1 text-xs text-ink-soft">Delivery and tax are added at checkout.</p>
                    <button
                      onClick={startCheckout}
                      className="mt-4 w-full rounded-full bg-red py-4 text-base font-bold text-cream shadow-lg shadow-red/25 transition hover:bg-red-deep active:scale-[0.98]"
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
