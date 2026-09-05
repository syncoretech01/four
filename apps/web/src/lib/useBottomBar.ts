"use client";

import { usePathname } from "next/navigation";
import { useStore } from "./store";

/**
 * Routes where a floating basket bar would be wrong: the back-office consoles,
 * the standalone payment walkthrough, and the payment page, which has its own
 * single primary action and must not compete with one.
 */
const NO_BASKET_BAR = ["/admin", "/rider", "/demo", "/pay"];

/**
 * True while the mobile basket bar is on screen. Every floating bottom-edge
 * surface — chat bubble, toast stack, active-order pill — lifts itself by this
 * one rule so nothing collides, and `BasketBar` itself renders from it, so the
 * bar and the lift can never disagree.
 *
 * The bar only renders below lg, so consumers apply the lift with responsive
 * classes (e.g. `bottom-24 lg:bottom-5`).
 */
export function useBottomBarVisible(): boolean {
  const pathname = usePathname();
  const count = useStore((s) => s.cart.itemCount);
  if (count === 0) return false;
  return !NO_BASKET_BAR.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
