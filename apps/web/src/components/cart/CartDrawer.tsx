"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useReduceMotion } from "@/lib/useAnim";
import { useDismissable } from "@/lib/useDismissable";
import { useKitchenOpen } from "@/lib/useKitchenOpen";
import { OPENS_LABEL } from "@/lib/hours";
import { formatPKR, FREE_DELIVERY_ABOVE, defaultTaxRate, orderTotals } from "@four/shared";
import { api, ApiError } from "@/lib/api";
import { toast } from "@/lib/toast";
import { useStore } from "@/lib/store";
import { SmartImage } from "../SmartImage";
import { PillCta } from "../ds/PillCta";
import { CheckoutForm } from "./CheckoutForm";
import { ItemModal, type ItemModalEdit, type MenuItemView } from "../menu/ItemModal";
import { HAND_MARK } from "../hero/logoPaths";
import type { CartLineView, CartView } from "@four/shared";
import { EASE_BRAND } from "@/lib/motionTokens";

export function CartDrawer() {
  const open = useStore((s) => s.cartOpen);
  const setOpen = useStore((s) => s.setCartOpen);
  const cart = useStore((s) => s.cart);
  const setCart = useStore((s) => s.setCart);
  const checkoutOpen = useStore((s) => s.checkoutOpen);
  const openCheckout = useStore((s) => s.openCheckout);
  const closeCheckout = useStore((s) => s.closeCheckout);
  const reduce = useReduceMotion();
  const kitchenOpen = useKitchenOpen();

  const close = () => setOpen(false);
  useDismissable(open, close);

  // focus lands on the close button when the drawer opens and goes back to
  // whatever opened it (the nav cart button, the basket bar) when it closes -
  // the same open -> closed rule MobileNav uses, without a ref from the opener
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open) {
      const active = document.activeElement;
      openerRef.current = active instanceof HTMLElement ? active : null;
      closeRef.current?.focus();
      wasOpen.current = true;
    } else if (wasOpen.current) {
      const opener = openerRef.current;
      if (opener?.isConnected) opener.focus();
      openerRef.current = null;
      wasOpen.current = false;
    }
  }, [open]);

  // cart-line editing: fetch the full item, reopen the picker seeded from the line
  const [editing, setEditing] = useState<{ item: MenuItemView; edit: ItemModalEdit } | null>(null);

  const editLine = async (line: CartLineView) => {
    try {
      const { item } = await api<{ item: MenuItemView }>(`/api/menu/items/${line.itemId}`);
      setEditing({
        item,
        edit: {
          lineId: line.lineId,
          variantId: line.variantId,
          qty: line.qty,
          modifiers: line.modifiers.map((m) => ({ groupId: m.groupId, optionId: m.optionId, qty: m.qty })),
        },
      });
    } catch {
      toast.error("Couldn't open that item — try again.");
    }
  };

  const setQty = (lineId: string, qty: number) => {
    // The PATCH returns the new cart; applying it keeps the drawer correct when
    // the socket is down, which is otherwise a silent failure (see useQuickAdd).
    api<CartView>("/api/cart/lines", { method: "PATCH", body: JSON.stringify({ lineId, qty }) })
      .then(setCart)
      .catch(() => {
        toast.error("Couldn't update your order — check your connection.");
      });
  };

  const startCheckout = async () => {
    try {
      const quote = await api<import("@four/shared").OrderQuote>("/api/orders/quote", {
        method: "POST",
        body: JSON.stringify({ payment: "COD" }),
      });
      openCheckout(quote);
    } catch (e) {
      // an empty-cart refusal already shows in the drawer; a network failure
      // would otherwise make the button silently do nothing
      if (!(e instanceof ApiError)) toast.error("Couldn't start checkout — check your connection.");
    }
  };

  const freeIn = Math.max(0, FREE_DELIVERY_ABOVE - cart.subtotal);
  // Show the whole ledger here rather than a bare subtotal: the drawer used to
  // read "Rs. 2,400" and checkout then revealed Rs. 2,933, a 22% jump at the
  // last step. `orderTotals` is the same function the server quotes with, so the
  // only reason this is an estimate is that the server's rates are env-tunable.
  const estCod = orderTotals(cart.subtotal, defaultTaxRate("COD"));
  const cardSaving = estCod.total - orderTotals(cart.subtotal, defaultTaxRate("CARD")).total;
  const freePct = Math.min(100, (cart.subtotal / FREE_DELIVERY_ABOVE) * 100);

  return (
    <>
      <AnimatePresence>
        {open && (
        <motion.div className="f-drawer__wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
                ref={closeRef}
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
                      {/* red hand on a beige disc: the drawer is white, and
                          red-on-white is not an approved lockup */}
                      <span className="f-empty__disc">
                        <svg viewBox="180 100 700 900" className="f-empty__glyph" aria-hidden>
                          <g transform={HAND_MARK.transform}>
                            <path d={HAND_MARK.d} fill="currentColor" />
                          </g>
                        </svg>
                      </span>
                      <p className="f-empty__text">
                        Nothing here yet. Browse the menu, or tell the assistant what you&apos;re craving.
                      </p>
                      <Link
                        href="/menu"
                        onClick={close}
                        className="f-btn f-btn--primary f-btn--md"
                      >
                        See the menu
                      </Link>
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
                            transition={{ duration: 0.25, ease: EASE_BRAND }}
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
                                {(l.variantId || l.modifiers.length > 0) && (
                                  <button
                                    onClick={() => editLine(l)}
                                    aria-label={`Edit ${l.name}`}
                                    className="f-btn f-btn--quiet"
                                  >
                                    Edit
                                  </button>
                                )}
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
                      <p className="text-sm font-medium text-ink-900">
                        {freeIn === 0 ? (
                          <span className="font-semibold text-red">Free delivery unlocked.</span>
                        ) : (
                          <>
                            <span className="font-semibold text-red">{formatPKR(freeIn)}</span> away from free delivery
                          </>
                        )}
                      </p>
                      <div className="f-progress mt-2">
                        <motion.div
                          className="f-progress__fill"
                          initial={false}
                          animate={{ width: `${freePct}%` }}
                          transition={{ duration: 0.4, ease: EASE_BRAND }}
                        />
                      </div>
                    </div>
                    <p className="f-summary__title mt-4">Estimated total</p>
                    <dl className="f-summary f-summary--ruled">
                      <div className="f-summary__row">
                        <dt>Subtotal</dt>
                        <dd>{formatPKR(cart.subtotal)}</dd>
                      </div>
                      <div className="f-summary__row">
                        <dt>Delivery</dt>
                        <dd>{estCod.deliveryFee === 0 ? "Free" : formatPKR(estCod.deliveryFee)}</dd>
                      </div>
                      <div className="f-summary__row">
                        <dt>Tax ({Math.round(defaultTaxRate("COD") * 100)}%)</dt>
                        <dd>{formatPKR(estCod.tax)}</dd>
                      </div>
                      <div className="f-summary__row is-total">
                        <dt>Estimated total</dt>
                        <dd>{formatPKR(estCod.total)}</dd>
                      </div>
                    </dl>
                    <p className="mt-1 text-xs text-ink-600">
                      Estimated at the cash rate; checkout quotes the exact figure.{" "}
                      {cardSaving > 0 && `Paying by card is taxed at ${Math.round(defaultTaxRate("CARD") * 100)}% — you would save ${formatPKR(cardSaving)}.`}
                      {freeIn > 0 && ` Delivery is free over ${formatPKR(FREE_DELIVERY_ABOVE)}.`}
                    </p>
                    <PillCta onClick={startCheckout} size="lg" block className="mt-4">
                      Checkout · {cart.itemCount} item{cart.itemCount === 1 ? "" : "s"}
                    </PillCta>
                    {!kitchenOpen && (
                      <p className="mt-3 text-center text-xs font-medium text-ink-600">
                        We open at {OPENS_LABEL} — you can build your order now and place it then.
                      </p>
                    )}
                  </footer>
                )}
              </>
            )}
          </motion.aside>
        </motion.div>
        )}
      </AnimatePresence>
      <ItemModal item={editing?.item ?? null} edit={editing?.edit} onClose={() => setEditing(null)} />
    </>
  );
}
