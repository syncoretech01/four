"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DELIVERY_FEE, FREE_DELIVERY_ABOVE, findItem, type MenuItem, type MenuVariant } from "@/data/menu";
import type { DeliveryLocation } from "@/data/locations";

export interface CartLine {
  key: string; // itemId + variantId
  itemId: string;
  variantId?: string;
  qty: number;
}

interface CartState {
  lines: CartLine[];
  location: DeliveryLocation | null;
  locationDismissed: boolean; // user closed the popup to browse
  cartOpen: boolean;
  add: (itemId: string, qty?: number, variantId?: string) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  setLocation: (loc: DeliveryLocation | null) => void;
  dismissLocation: () => void;
  setCartOpen: (open: boolean) => void;
}

export const useStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      location: null,
      locationDismissed: false,
      cartOpen: false,
      add: (itemId, qty = 1, variantId) =>
        set((s) => {
          const key = variantId ? `${itemId}:${variantId}` : itemId;
          const existing = s.lines.find((l) => l.key === key);
          if (existing) {
            return { lines: s.lines.map((l) => (l.key === key ? { ...l, qty: Math.min(99, l.qty + qty) } : l)) };
          }
          return { lines: [...s.lines, { key, itemId, variantId, qty }] };
        }),
      remove: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
      setQty: (key, qty) =>
        set((s) => ({
          lines: qty <= 0 ? s.lines.filter((l) => l.key !== key) : s.lines.map((l) => (l.key === key ? { ...l, qty: Math.min(99, qty) } : l)),
        })),
      clear: () => set({ lines: [] }),
      setLocation: (location) => set({ location }),
      dismissLocation: () => set({ locationDismissed: true }),
      setCartOpen: (cartOpen) => set({ cartOpen }),
    }),
    {
      name: "four-cart",
      partialize: (s) => ({ lines: s.lines, location: s.location }),
    },
  ),
);

export interface PricedLine extends CartLine {
  item: MenuItem;
  variant?: MenuVariant;
  unitPrice: number;
  lineTotal: number;
  label: string;
}

export function priceLine(line: CartLine): PricedLine | null {
  const item = findItem(line.itemId);
  if (!item) return null;
  const variant = line.variantId ? item.variants?.find((v) => v.id === line.variantId) : undefined;
  const unitPrice = variant?.price ?? item.price;
  return {
    ...line,
    item,
    variant,
    unitPrice,
    lineTotal: unitPrice * line.qty,
    label: variant ? `${item.name} (${variant.label})` : item.name,
  };
}

export function cartSummary(lines: CartLine[]) {
  const priced = lines.map(priceLine).filter((l): l is PricedLine => l !== null);
  const subtotal = priced.reduce((sum, l) => sum + l.lineTotal, 0);
  const delivery = subtotal === 0 || subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
  return { priced, subtotal, delivery, total: subtotal + delivery, count: priced.reduce((n, l) => n + l.qty, 0) };
}
