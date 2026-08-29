"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { formatPKR, type MenuItem } from "@/data/menu";
import { useStore } from "@/lib/store";
import { SmartImage } from "../SmartImage";

/** Full item card: real photo, variant picker, quantity, add to cart. */
export function ItemModal({ item, onClose }: { item: MenuItem | null; onClose: () => void }) {
  const add = useStore((s) => s.add);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const [variantId, setVariantId] = useState<string | undefined>(undefined);
  const [qty, setQty] = useState(1);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (item) {
      setVariantId(item.variants?.[0]?.id);
      setQty(1);
    }
  }, [item]);

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [item, onClose]);

  const variant = item?.variants?.find((v) => v.id === variantId);
  const unitPrice = variant?.price ?? item?.price ?? 0;

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={item.name}
            className="relative max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-card bg-cream shadow-2xl shadow-ink/30 sm:rounded-card"
            initial={reduce ? false : { y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
          >
            <div className="relative aspect-[16/9]">
              <SmartImage src={item.image} alt={item.name} fallbackLabel={item.name} className="h-full w-full object-cover" />
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-cream/90 text-ink shadow transition hover:bg-cream active:scale-95"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="p-7">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-display text-3xl text-ink">{item.name}</h3>
                <span className="shrink-0 text-xl font-bold text-red">{formatPKR(unitPrice)}</span>
              </div>
              <p className="mt-2 text-ink-soft">{item.description}</p>

              {item.variants && (
                <div className="mt-6">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink">Choose size</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.variants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setVariantId(v.id)}
                        className={`rounded-full border-2 px-5 py-2.5 text-sm font-semibold transition active:scale-[0.97] ${
                          v.id === variantId
                            ? "border-red bg-red text-cream"
                            : "border-ink/15 text-ink hover:border-ink/40"
                        }`}
                      >
                        {v.label} · {formatPKR(v.price)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-7 flex items-center gap-4">
                <div className="flex items-center rounded-full border-2 border-ink/15">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="flex h-12 w-12 items-center justify-center text-xl font-bold text-ink transition hover:text-red active:scale-90"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-ink" aria-live="polite">{qty}</span>
                  <button
                    onClick={() => setQty((q) => Math.min(20, q + 1))}
                    aria-label="Increase quantity"
                    className="flex h-12 w-12 items-center justify-center text-xl font-bold text-ink transition hover:text-red active:scale-90"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => {
                    add(item.id, qty, variantId);
                    onClose();
                    setCartOpen(true);
                  }}
                  className="h-12 flex-1 rounded-full bg-red text-base font-semibold text-cream transition hover:bg-red-deep active:scale-[0.98]"
                >
                  Add {qty > 1 ? `${qty} ` : ""}to cart · {formatPKR(unitPrice * qty)}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
