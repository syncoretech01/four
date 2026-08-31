"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useReduceMotion } from "@/lib/useAnim";
import { SmartImage } from "../SmartImage";

/** Lightbox showing the real printed menu sheet for the active category. */
export function BoardLightbox({
  open,
  category,
  onClose,
}: {
  open: boolean;
  category: { label: string; boardImage: string };
  onClose: () => void;
}) {
  const reduce = useReduceMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="f-modal__wrap !p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="f-scrim f-scrim--heavy" onClick={onClose} aria-hidden />
          <motion.figure
            role="dialog"
            aria-modal="true"
            aria-label={`${category.label} printed menu`}
            className="f-modal max-w-2xl p-3"
            initial={reduce ? false : { scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            <button
              onClick={onClose}
              aria-label="Close menu board"
              className="f-modal__close f-iconbtn f-iconbtn--md f-iconbtn--cream"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <SmartImage
              src={category.boardImage}
              alt={`${category.label} printed menu`}
              fallbackLabel={category.label}
              className="min-h-72 w-full rounded-[0.9rem] border-2 border-ink-900 object-contain"
            />
            <figcaption className="p-4 text-center text-sm text-ink-600">
              The menu exactly as printed in the restaurant. Prices exclusive of tax.
            </figcaption>
          </motion.figure>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
