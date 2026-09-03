"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { BRAND } from "@four/shared";
import { useReduceMotion } from "@/lib/useAnim";
import { useDismissable } from "@/lib/useDismissable";
import { useKitchenOpen } from "@/lib/useKitchenOpen";
import { useStore } from "@/lib/store";
import { BrandLogo } from "../BrandLogo";

/**
 * Mobile navigation: a full-screen paper takeover, not a drawer - the
 * right-edge drawer is the cart's signature move, and the loud display type
 * wants the whole canvas. Closes on route change, Escape, or the X; focus
 * lands on the close button and returns to the hamburger.
 */
export function MobileNav({
  open,
  onClose,
  links,
  returnFocusTo,
}: {
  open: boolean;
  onClose: () => void;
  links: { href: string; label: string }[];
  returnFocusTo?: React.RefObject<HTMLButtonElement | null>;
}) {
  const pathname = usePathname();
  const reduce = useReduceMotion();
  const kitchenOpen = useKitchenOpen();
  const location = useStore((s) => s.location);
  const setLocationModalOpen = useStore((s) => s.setLocationModalOpen);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useDismissable(open, onClose);

  useEffect(() => {
    if (open) {
      closeRef.current?.focus();
      wasOpen.current = true;
    } else if (wasOpen.current) {
      // only return focus on a real open -> closed transition, never on mount
      returnFocusTo?.current?.focus();
      wasOpen.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // navigating away closes the sheet
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-50 flex flex-col bg-cream md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            initial={reduce ? false : { y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex h-16 shrink-0 items-center justify-between border-b border-rule px-4"
          >
            <Link href="/" onClick={onClose} aria-label="FOUR home" className="text-red">
              <BrandLogo className="h-7" />
            </Link>
            <button ref={closeRef} onClick={onClose} aria-label="Close menu" className="f-iconbtn f-iconbtn--sm">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </motion.div>

          <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-5 pt-3">
            {links.map((l, i) => {
              const active = pathname === l.href;
              return (
                <motion.div
                  key={l.href}
                  initial={reduce ? false : { y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.05 + i * 0.045, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href={l.href}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    className={`block border-b border-rule py-4 font-display text-4xl uppercase leading-[0.9] transition ${
                      active ? "text-red" : "text-ink-900 hover:text-red"
                    }`}
                  >
                    {l.label}
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          <motion.div
            initial={reduce ? false : { y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="grid shrink-0 gap-3 border-t border-rule bg-white px-5 py-5"
          >
            <button
              onClick={() => {
                onClose();
                setLocationModalOpen(true);
              }}
              className="f-chip w-full justify-between"
            >
              <span className="flex min-w-0 items-center gap-2">
                <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden className="shrink-0">
                  <path d="M6 13S1 8.6 1 5.4a5 5 0 1 1 10 0C11 8.6 6 13 6 13Z" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="6" cy="5.4" r="1.6" fill="currentColor" />
                </svg>
                <span className="truncate">{location ? `${location.block}, ${location.areaName}` : "Set delivery area"}</span>
              </span>
              <span className="shrink-0 text-xs font-extrabold uppercase tracking-[0.08em] text-red">Change</span>
            </button>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="f-livepill">
                <span className={`f-dot ${kitchenOpen ? "" : "f-dot--off"}`} aria-hidden>
                  {kitchenOpen && <span className="f-dot__ping" />}
                  <span className="f-dot__core" />
                </span>
                {kitchenOpen ? "Open now · till 3am" : "Opens 1pm"}
              </span>
              <a href={BRAND.phoneHref} className="f-btn f-btn--outline f-btn--sm">
                Call {BRAND.phone}
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
