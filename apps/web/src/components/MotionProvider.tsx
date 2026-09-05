"use client";

import { MotionConfig } from "motion/react";

/**
 * Honours the OS reduced-motion preference for every motion element: with
 * `reducedMotion="user"` motion skips transform animations and keeps only
 * opacity.
 *
 * Its remit is now just the interaction layer — drawers, modals, toasts, the
 * chat dock. Scroll reveals and page entrances moved to CSS (`ds/Reveal`,
 * `ds/Rise`), which read the same media query directly and so need no
 * provider, no hydration and no client boundary.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
