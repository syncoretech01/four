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
import { CLOSES_LABEL, OPENS_LABEL } from "@/lib/hours";
import { BrandLogo } from "../BrandLogo";
import { DoodleBackdrop } from "../ds/DoodleBackdrop";

/**
 * Mobile navigation: a full-screen red takeover, not a drawer - the
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
          className="f-mobilenav fixed inset-0 z-50 flex flex-col md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <DoodleBackdrop />
          <motion.div
            initial={reduce ? false : { y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative z-[1] flex h-[var(--nav-h)] shrink-0 items-center justify-between border-b border-rule-white px-4"
          >
            <Link href="/" onClick={onClose} aria-label="FOUR home" className="text-white">
              <BrandLogo className="h-7" />
            </Link>
            <button ref={closeRef} onClick={onClose} aria-label="Close menu" className="f-iconbtn f-iconbtn--md f-iconbtn--on-red">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </motion.div>

          <nav aria-label="Mobile" className="relative z-[1] flex-1 overflow-y-auto px-5 pt-3">
            {links.map((l, i) => {
              const active = pathname === l.href;
              return (
                <motion.div
                  key={l.href}
                  initial={reduce ? false : { y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.05 + i * 0.045, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link href={l.href} onClick={onClose} aria-current={active ? "page" : undefined} className="f-mobilenav__link">
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
            className="relative z-[1] grid shrink-0 gap-3 border-t border-rule-white bg-red-press px-5 py-5"
          >
            <button
              onClick={() => {
                onClose();
                setLocationModalOpen(true);
              }}
              className="f-btn f-btn--on-red f-btn--md f-btn--block justify-between"
            >
              <span className="flex min-w-0 items-center gap-2">
                <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden className="shrink-0">
                  <path d="M6 13S1 8.6 1 5.4a5 5 0 1 1 10 0C11 8.6 6 13 6 13Z" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="6" cy="5.4" r="1.6" fill="currentColor" />
                </svg>
                <span className="truncate">{location ? `${location.block}, ${location.areaName}` : "Set delivery area"}</span>
              </span>
              <span className="shrink-0 text-yellow">Change</span>
            </button>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="f-livepill f-livepill--on-red">
                <span className={`f-dot f-dot--cream ${kitchenOpen ? "" : "f-dot--off"}`} aria-hidden>
                  {kitchenOpen && <span className="f-dot__ping" />}
                  <span className="f-dot__core" />
                </span>
                {kitchenOpen ? `Open now · till ${CLOSES_LABEL}` : `Opens ${OPENS_LABEL}`}
              </span>
              <a href={BRAND.phoneHref} className="f-btn f-btn--primary f-btn--sm">
                Call {BRAND.phone}
              </a>
            </div>
            <a href={BRAND.instagram} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-yellow">
              {BRAND.instagramHandle}
            </a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
