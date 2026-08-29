"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartView, OrderQuote } from "@four/shared";
import { api } from "./api";
import { getSocket } from "./socket";

export interface DeliveryLocation {
  areaId: string;
  areaName: string;
  block: string;
}

interface AppState {
  cart: CartView;
  cartOpen: boolean;
  checkoutOpen: boolean;
  quote: OrderQuote | null;
  location: DeliveryLocation | null;
  locationDismissed: boolean;
  setCart: (cart: CartView) => void;
  setCartOpen: (open: boolean) => void;
  openCheckout: (quote: OrderQuote | null) => void;
  closeCheckout: () => void;
  setLocation: (loc: DeliveryLocation | null) => void;
  dismissLocation: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      cart: { lines: [], subtotal: 0, itemCount: 0 },
      cartOpen: false,
      checkoutOpen: false,
      quote: null,
      location: null,
      locationDismissed: false,
      setCart: (cart) => set({ cart }),
      setCartOpen: (cartOpen) => set({ cartOpen, ...(cartOpen ? {} : { checkoutOpen: false }) }),
      openCheckout: (quote) => set({ cartOpen: true, checkoutOpen: true, quote }),
      closeCheckout: () => set({ checkoutOpen: false, quote: null }),
      setLocation: (location) => set({ location }),
      dismissLocation: () => set({ locationDismissed: true }),
    }),
    {
      name: "four-ui",
      partialize: (s) => ({ location: s.location }),
    },
  ),
);

let wired = false;

/** Fetch initial cart and keep it live over the socket. Call once from any client component. */
export function wireCart(): void {
  if (wired || typeof window === "undefined") return;
  wired = true;
  api<CartView>("/api/cart")
    .then((cart) => useStore.getState().setCart(cart))
    .catch(() => {});
  getSocket().on("cart:updated", (cart) => useStore.getState().setCart(cart));
}
