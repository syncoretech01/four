"use client";

import { usePathname } from "next/navigation";
import { useStore } from "./store";

/**
 * True while the mobile basket bar is on screen (/menu with items in the
 * cart). Every floating bottom-edge surface — chat bubble, toast stack,
 * active-order pill — lifts itself by this one rule so nothing collides.
 * The bar only renders below lg, so consumers apply the lift with
 * responsive classes (e.g. `bottom-24 lg:bottom-5`).
 */
export function useBottomBarVisible(): boolean {
  const pathname = usePathname();
  const count = useStore((s) => s.cart.itemCount);
  return pathname === "/menu" && count > 0;
}
