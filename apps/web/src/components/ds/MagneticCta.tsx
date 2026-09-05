"use client";

import { type ReactNode } from "react";
import { Magnet } from "../rb/Magnet";
import { useReduceMotion } from "@/lib/useAnim";
import { useFinePointer } from "@/lib/useFinePointer";
import { EASE_BRAND_CSS } from "@/lib/motionTokens";

/**
 * Makes a CTA lean toward the cursor as it approaches.
 *
 * A separate wrapper rather than a change to `PillCta`, which is server-safe by
 * contract and re-exported through the design bundle. Use it at call sites; the
 * button itself stays a server component.
 *
 * Gated on a fine pointer as well as reduced motion: on touch there is no
 * cursor to lean toward, and the listener would run for nothing. Never wrap a
 * `block` CTA — `f-cta--block` is `width: 100%` and Magnet's wrapper is
 * `inline-block`, which would collapse it.
 */
export function MagneticCta({
  children,
  strength = 3.2,
  padding = 70,
  className,
}: {
  children: ReactNode;
  /** Higher divides the offset further, so higher = subtler. */
  strength?: number;
  /** How far away the pull starts, in px. */
  padding?: number;
  className?: string;
}) {
  const reduce = useReduceMotion();
  const fine = useFinePointer();

  return (
    <Magnet
      disabled={reduce || !fine}
      magnetStrength={strength}
      padding={padding}
      wrapperClassName={className}
      activeTransition={`transform 0.25s ${EASE_BRAND_CSS}`}
      inactiveTransition={`transform 0.5s ${EASE_BRAND_CSS}`}
    >
      {children}
    </Magnet>
  );
}
