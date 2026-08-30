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
 */
export function useReduceMotion(): boolean {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? !!reduce : false;
}
