"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

/**
 * Hydration-safe reduced-motion flag. `useReducedMotion()` reads the media
 * query synchronously on the client but returns null on the server, so
 * branching `initial`/`style` on it directly makes the server and first
 * client render disagree (a hydration mismatch). Gating on a mounted flag
 * makes the first client render match the server (motion on), then the real
 * preference applies on the next tick.
 *
 * CONTRACT — only for elements that mount AFTER hydration in response to a
 * user interaction: drawers, modals, toasts, the quick-add label swap. Never
 * for anything present in the server HTML. Because this returns `false` until
 * mounted, an `initial={reduce ? false : {opacity: 0}}` on server-rendered
 * markup always takes the hidden branch — which is how the scroll reveals used
 * to ship `opacity: 0` in the SSR HTML and make the hero ineligible for LCP.
 * Server-rendered entrances belong to `ds/Rise` and `ds/Reveal`, which decide
 * in CSS off the media query and default to the finished state.
 */
export function useReduceMotion(): boolean {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? !!reduce : false;
}

/**
 * The same preference, read straight from the media query for use *inside an
 * effect*. `useReduceMotion` cannot answer this on the first commit — it
 * reports `false` until its mount effect lands — so anything that decides
 * whether to start an animation as it mounts must ask here instead.
 * Effect-only: never call this during render.
 */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
