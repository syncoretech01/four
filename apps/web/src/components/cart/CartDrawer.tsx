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
          <div className="f-scrim" onClick={close} aria-hidden />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Your order"
            className="f-drawer"
            initial={reduce ? false : { x: "100%" }}
            animate={{ x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
          >
            <header className="f-drawer__head">
              <h2 className="f-drawer__title">
                {checkoutOpen ? "Checkout" : "Your order"}
              </h2>
              <button
                onClick={close}
                aria-label="Close cart"
                className="f-iconbtn f-iconbtn--sm f-iconbtn--plain"
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
                <div className="f-drawer__body">
                  {cart.lines.length === 0 ? (
                    <div className="f-empty h-full">
                      <svg viewBox="180 100 700 900" className="f-empty__glyph text-red" aria-hidden>
                        <g transform={HAND_MARK.transform}>
                          <path d={HAND_MARK.d} fill="currentColor" />
                        </g>
                      </svg>
                      <p className="f-empty__text">
                        Nothing here yet. Browse the menu, or tell the assistant what you&apos;re craving.
                      </p>
                      <a
                        href="#menu"
                        onClick={close}
                        className="f-btn f-btn--primary f-btn--md"
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
                            className="f-line overflow-hidden"
                          >
                            <div className="f-line__thumb">
                              {l.image && (
                                <SmartImage src={l.image} alt={l.name} fallbackLabel={l.name} className="h-full w-full object-cover" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="f-line__name truncate">
                                {l.name}
                                {l.variantLabel ? ` (${l.variantLabel})` : ""}
                              </p>
                              {l.modifiers.length > 0 && (
                                <p className="f-line__mods truncate">
                                  {l.modifiers.map((m) => (m.qty > 1 ? `${m.label} x${m.qty}` : m.label)).join(", ")}
                                </p>
                              )}
                              <div className="f-line__foot">
                                <div className="f-qty f-qty--sm">
                                  <button
                                    onClick={() => setQty(l.lineId, l.qty - 1)}
                                    aria-label={`Remove one ${l.name}`}
                                    className="f-qty__btn"
                                  >
                                    -
                                  </button>
                                  <span className="f-qty__val">{l.qty}</span>
                                  <button
                                    onClick={() => setQty(l.lineId, l.qty + 1)}
                                    aria-label={`Add one ${l.name}`}
                                    className="f-qty__btn"
                                  >
                                    +
                                  </button>
                                </div>
                                <span className="f-line__total">{formatPKR(l.lineTotal)}</span>
                              </div>
                            </div>
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </ul>
                  )}
                </div>

                {cart.lines.length > 0 && (
                  <footer className="f-drawer__foot">
                    {/* free-delivery progress: a genuine nudge, not decoration */}
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-ink-900">
                        {freeIn === 0 ? (
                          <span className="font-bold text-red">Free delivery unlocked.</span>
                        ) : (
                          <>
                            <span className="font-bold text-red">{formatPKR(freeIn)}</span> away from free delivery
                          </>
                        )}
                      </p>
                      <div className="f-progress">
                        <motion.div
                          className="f-progress__fill"
                          initial={false}
                          animate={{ width: `${freePct}%` }}
                          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                    </div>
                    <dl className="f-summary mt-4">
                      <div className="f-summary__row is-total">
                        <dt>Subtotal</dt>
                        <dd>{formatPKR(cart.subtotal)}</dd>
                      </div>
                    </dl>
                    <p className="mt-1 text-xs text-ink-600">Delivery and tax are added at checkout.</p>
                    <button
                      onClick={startCheckout}
                      className="f-btn f-btn--primary f-btn--lg f-btn--block mt-4"
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
