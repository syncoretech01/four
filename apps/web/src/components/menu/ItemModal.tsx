"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { formatPKR } from "@four/shared";
import { api, ApiError } from "@/lib/api";
import { useStore } from "@/lib/store";
import { SmartImage } from "../SmartImage";

export interface MenuItemView {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  basePrice: number;
  image: string | null;
  available: boolean;
  tags: string[];
  variants: { id: string; slug: string; label: string; price: number }[];
  modifierGroups: {
    id: string;
    label: string;
    maxSelections: number;
    options: { id: string; slug: string; label: string; price: { flat?: number; bySize?: Record<string, number> } }[];
  }[];
}

function optionPrice(
  price: { flat?: number; bySize?: Record<string, number> },
  variantSlug: string | undefined,
): number {
  if (typeof price.flat === "number") return price.flat;
  if (price.bySize) return variantSlug && price.bySize[variantSlug] !== undefined ? price.bySize[variantSlug] : Math.min(...Object.values(price.bySize));
  return 0;
}

/** Full item card: real photo, size picker, meal deals / add-ons, qty, add to cart. */
export function ItemModal({ item, onClose }: { item: MenuItemView | null; onClose: () => void }) {
  const setCartOpen = useStore((s) => s.setCartOpen);
  const [variantSlug, setVariantSlug] = useState<string | undefined>();
  const [qty, setQty] = useState(1);
  const [picked, setPicked] = useState<Record<string, number>>({}); // "groupId:optionSlug" -> qty
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const reduce = useReducedMotion();

  useEffect(() => {
    if (item) {
      setVariantSlug(item.variants[0]?.slug);
      setQty(1);
      setPicked({});
      setError("");
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

  const unitPrice = useMemo(() => {
    if (!item) return 0;
    const variant = item.variants.find((v) => v.slug === variantSlug);
    let price = variant?.price ?? item.basePrice;
    for (const [key, n] of Object.entries(picked)) {
      const [groupId, optionSlug] = key.split("|");
      const group = item.modifierGroups.find((g) => g.id === groupId);
      const opt = group?.options.find((o) => o.slug === optionSlug);
      if (opt) price += optionPrice(opt.price, variantSlug) * n;
    }
    return price;
  }, [item, variantSlug, picked]);

  const toggleOption = (groupId: string, optionSlug: string, max: number) => {
    const key = `${groupId}|${optionSlug}`;
    setPicked((p) => {
      const next = { ...p };
      const groupCount = Object.entries(p).filter(([k]) => k.startsWith(`${groupId}|`)).reduce((s, [, n]) => s + n, 0);
      if (next[key]) {
        delete next[key];
      } else if (max === 1) {
        for (const k of Object.keys(next)) if (k.startsWith(`${groupId}|`)) delete next[k];
        next[key] = 1;
      } else if (groupCount < max) {
        next[key] = 1;
      }
      return next;
    });
  };

  const add = async () => {
    if (!item) return;
    setBusy(true);
    setError("");
    try {
      await api("/api/cart/lines", {
        method: "POST",
        body: JSON.stringify({
          itemId: item.id,
          variantId: variantSlug,
          qty,
          modifiers: Object.entries(picked).map(([key, n]) => {
            const [groupId, optionId] = key.split("|");
            return { groupId, optionId, qty: n };
          }),
        }),
      });
      onClose();
      setCartOpen(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not add to cart. Try again.");
    } finally {
      setBusy(false);
    }
  };

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
              <SmartImage
                src={item.image ?? `/menu-items/${item.id}.jpg`}
                alt={item.name}
                fallbackLabel={item.name}
                className="h-full w-full object-cover"
              />
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
                <h3 className="font-display text-3xl font-semibold text-ink">{item.name}</h3>
                <span className="shrink-0 text-xl font-bold text-red">{formatPKR(unitPrice)}</span>
              </div>
              <p className="mt-2 text-ink-soft">{item.description}</p>

              {item.variants.length > 0 && (
                <div className="mt-6">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink">Choose size</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.variants.map((v) => (
                      <button
                        key={v.slug}
                        onClick={() => setVariantSlug(v.slug)}
                        className={`rounded-full border-2 px-5 py-2.5 text-sm font-semibold transition active:scale-[0.97] ${
                          v.slug === variantSlug ? "border-red bg-red text-cream" : "border-ink/15 text-ink hover:border-ink/40"
                        }`}
                      >
                        {v.label} · {formatPKR(v.price)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {item.modifierGroups.map((group) => (
                <div key={group.id} className="mt-6">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink">
                    {group.label}
                    <span className="ml-2 font-normal normal-case text-ink-soft">
                      {group.maxSelections === 1 ? "pick one" : `up to ${group.maxSelections}`}
                    </span>
                  </span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {group.options.map((opt) => {
                      const key = `${group.id}|${opt.slug}`;
                      const on = Boolean(picked[key]);
                      return (
                        <button
                          key={opt.slug}
                          onClick={() => toggleOption(group.id, opt.slug, group.maxSelections)}
                          className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition active:scale-[0.97] ${
                            on ? "border-red bg-red/10 text-red" : "border-ink/15 text-ink hover:border-ink/40"
                          }`}
                        >
                          {opt.label} +{formatPKR(optionPrice(opt.price, variantSlug))}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {error && (
                <p role="alert" className="mt-4 rounded-xl bg-red/10 px-4 py-3 text-sm font-medium text-red">
                  {error}
                </p>
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
                  <span className="w-8 text-center font-bold text-ink" aria-live="polite">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty((q) => Math.min(20, q + 1))}
                    aria-label="Increase quantity"
                    className="flex h-12 w-12 items-center justify-center text-xl font-bold text-ink transition hover:text-red active:scale-90"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={add}
                  disabled={busy}
                  className="h-12 flex-1 rounded-full bg-red text-base font-semibold text-cream transition hover:bg-red-deep active:scale-[0.98] disabled:opacity-60"
                >
                  {busy ? "Adding..." : `Add ${qty > 1 ? `${qty} ` : ""}to cart · ${formatPKR(unitPrice * qty)}`}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
