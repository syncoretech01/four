"use client";

import { ClickSpark } from "../rb/ClickSpark";
import { onSpark } from "@/lib/spark";
import { useReduceMotion } from "@/lib/useAnim";

/**
 * The one spark canvas for the whole app, mounted in the root layout beside
 * ToastStack. It fires only on add-to-cart — the action the site exists for —
 * so it stays a reward rather than decoration.
 *
 * z-55 puts it above the page chrome (z-40) and the item picker (z-50) but
 * below the toast stack (z-60), so a burst never covers the message that
 * follows it. `pointer-events: none` and `aria-hidden` keep it out of the way
 * of both the mouse and assistive tech.
 *
 * Under reduced motion nothing is mounted at all: no canvas, no listener, no
 * rAF. `spark()` then finds no subscriber and is a no-op, so call sites need no
 * guard of their own.
 */
export function SparkLayer() {
  const reduce = useReduceMotion();
  if (reduce) return null;

  return (
    <ClickSpark
      subscribe={onSpark}
      // A literal, not var(--yellow): canvas strokeStyle does not resolve CSS
      // custom properties, and an unparseable value silently keeps the previous
      // colour. Mirrors --yellow in styles/ds/tokens/colors.css.
      sparkColor="#ffd23f"
      sparkCount={10}
      sparkRadius={22}
      sparkSize={12}
      duration={400}
      className="pointer-events-none fixed inset-0 z-[55]"
    />
  );
}
