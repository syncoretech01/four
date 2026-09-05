"use client";

import { AnimatePresence, motion } from "motion/react";
import { formatPKR } from "@four/shared";
import { useReduceMotion } from "@/lib/useAnim";
import { useBottomBarVisible } from "@/lib/useBottomBar";
import { useStore } from "@/lib/store";

/**
 * Mobile-only sticky footer bar with the running basket total - the KFC
 * "View basket" pattern. Desktop already has the cart button in the nav.
 * Right padding leaves the corner clear for the chat dock's bubble.
 *
 * Mounted in the root layout rather than on /menu, because quick-add is wired
 * on the homepage bestsellers too and everywhere except /menu the only cart
 * affordance was a 44px bag icon in the TOP-LEFT of the fixed bar — the hardest
 * corner of a phone to reach with the thumb that just tapped Add.
 * `useBottomBarVisible` decides where it shows, and every other floating
 * bottom-edge surface reads the same hook to lift out of its way.
 */
export function BasketBar() {
  const cart = useStore((s) => s.cart);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const reduce = useReduceMotion();
  const visible = useBottomBarVisible();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={reduce ? false : { y: 96 }}
          animate={{ y: 0 }}
          exit={{ y: 96 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-white/95 px-4 py-3 backdrop-blur-[10px] [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
        >
          <button onClick={() => setCartOpen(true)} className="f-btn f-btn--primary f-btn--lg f-btn--block justify-between px-5">
            <span className="inline-flex items-center gap-2 whitespace-nowrap">
              View basket
              <span className="f-tag f-tag--count">{cart.itemCount}</span>
            </span>
            <span className="whitespace-nowrap">{formatPKR(cart.subtotal)}</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
