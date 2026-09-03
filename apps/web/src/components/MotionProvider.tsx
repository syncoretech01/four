"use client";

import { MotionConfig } from "motion/react";

/**
 * Honours the OS reduced-motion preference for every motion element: with
 * `reducedMotion="user"` motion skips transform animations (the 24px reveal
 * slides, the hero rises) and keeps only opacity, regardless of the
 * hydration-safe `useReduceMotion()` gate that still applies `initial` on the
 * first client render.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
