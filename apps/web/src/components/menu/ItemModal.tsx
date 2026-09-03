"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useReduceMotion } from "@/lib/useAnim";
import { useDismissable } from "@/lib/useDismissable";
import { formatPKR } from "@four/shared";
import { api, ApiError } from "@/lib/api";
import { useStore } from "@/lib/store";
import { SmartImage } from "../SmartImage";
import { TagStack } from "./tags";

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

/**
 * Full item card: real photo, size picker, meal deals / add-ons, qty, add to
 * cart. With `edit` it becomes the cart-line editor: seeded from the line,
 * "Update" swaps the line in place (add first, then drop the old one, so the
 * cart never flashes empty).
 */
export interface ItemModalEdit {
  lineId: string;
  variantId?: string;
  qty: number;
  modifiers: { groupId: string; optionId: string; qty: number }[];
}

export function ItemModal({
  item,
  edit,
  onClose,
}: {
  item: MenuItemView | null;
  edit?: ItemModalEdit;
  onClose: () => void;
}) {
  const setCartOpen = useStore((s) => s.setCartOpen);
  const [variantSlug, setVariantSlug] = useState<string | undefined>();
  const [qty, setQty] = useState(1);
  const [picked, setPicked] = useState<Record<string, number>>({}); // "groupId:optionSlug" -> qty
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const reduce = useReduceMotion();

  useEffect(() => {
    if (item) {
      setVariantSlug(edit?.variantId ?? item.variants[0]?.slug);
      setQty(edit?.qty ?? 1);
      setPicked(edit ? Object.fromEntries(edit.modifiers.map((m) => [`${m.groupId}|${m.optionId}`, m.qty])) : {});
      setError("");
    }
  }, [item, edit]);

  useDismissable(Boolean(item), onClose);
  const isOpen = item !== null;
  // focus lands on the close button when the dialog opens and returns to the
  // element that opened it (the card, the nav pill) when it closes
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen]);

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
      if (edit) {
        // drop the line being replaced only after the new one is safely in
        await api("/api/cart/lines", { method: "PATCH", body: JSON.stringify({ lineId: edit.lineId, qty: 0 }) });
      }
      onClose();
      setCartOpen(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : edit ? "Could not update the line. Try again." : "Could not add to cart. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          className="f-modal__wrap f-modal__wrap--sheet sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="f-scrim" onClick={onClose} aria-hidden />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={item.name}
            className="f-modal max-w-2xl"
            initial={reduce ? false : { y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
          >
            <span className="f-sheet__grab sm:hidden" aria-hidden />
            <div className="relative aspect-[16/9] overflow-hidden border-b border-rule">
              <SmartImage
                src={item.image ?? `/menu-items/${item.id}.jpg`}
                alt={item.name}
                fallbackLabel={item.name}
                className="h-full w-full object-cover"
              />
              <TagStack tags={item.tags} className="absolute left-5 top-5" />
              <button
                onClick={onClose}
                ref={closeRef}
                aria-label="Close"
                className="f-modal__close f-iconbtn f-iconbtn--md f-iconbtn--cream"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="p-7 pt-6">
              <div className="flex items-start justify-between gap-4">
                <h3 className="f-heading f-heading--md">{item.name}</h3>
                <span className="shrink-0 font-display text-2xl text-red">{formatPKR(unitPrice)}</span>
              </div>
              <p className="mt-2 leading-relaxed text-ink-600">{item.description}</p>

              {item.variants.length > 0 && (
                <div className="mt-6">
                  <span id="size-label" className="f-field__label">
                    Choose size
                  </span>
                  <div role="radiogroup" aria-labelledby="size-label" className="mt-2 flex flex-wrap gap-2">
                    {item.variants.map((v) => (
                      <button
                        key={v.slug}
                        role="radio"
                        aria-checked={v.slug === variantSlug}
                        onClick={() => setVariantSlug(v.slug)}
                        className={`f-chip ${v.slug === variantSlug ? "is-on" : ""}`}
                      >
                        {v.label} · {formatPKR(v.price)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {item.modifierGroups.map((group) => (
                <div key={group.id} className="mt-6">
                  <span id={`mods-${group.id}`} className="f-field__label">
                    {group.label}
                    <span className="ml-2 font-medium normal-case tracking-normal text-ink-600">
                      {group.maxSelections === 1 ? "pick one" : `up to ${group.maxSelections}`}
                    </span>
                  </span>
                  <div role="group" aria-labelledby={`mods-${group.id}`} className="mt-2 flex flex-wrap gap-2">
                    {group.options.map((opt) => {
                      const key = `${group.id}|${opt.slug}`;
                      const on = Boolean(picked[key]);
                      return (
                        <button
                          key={opt.slug}
                          aria-pressed={on}
                          onClick={() => toggleOption(group.id, opt.slug, group.maxSelections)}
                          className={`f-chip f-chip--sm f-chip--soft ${on ? "is-on" : ""}`}
                        >
                          {opt.label} +{formatPKR(optionPrice(opt.price, variantSlug))}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {error && (
                <p role="alert" className="f-notice f-notice--error mt-4">
                  {error}
                </p>
              )}

              <div className="mt-7 flex items-center gap-4">
                <div className="f-qty">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="f-qty__btn"
                  >
                    -
                  </button>
                  <span className="f-qty__val" aria-live="polite">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty((q) => Math.min(20, q + 1))}
                    aria-label="Increase quantity"
                    className="f-qty__btn"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={add}
                  aria-busy={busy}
                  className={`f-btn f-btn--primary f-btn--lg flex-1 ${busy ? "is-loading" : ""}`}
                >
                  {edit
                    ? `Update · ${formatPKR(unitPrice * qty)}`
                    : `Add ${qty > 1 ? `${qty} ` : ""}to cart · ${formatPKR(unitPrice * qty)}`}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
