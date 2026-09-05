"use client";

/**
 * Vendored from react-bits (MIT + Commons Clause),
 * src/ts-tailwind/TextAnimations/CountUp/CountUp.tsx, fetched 2026-09-04.
 *
 * Adapted: "use client"; named export; renders `children` as the SSR and
 * reduced-motion value (upstream returns an EMPTY span and fills it from an
 * effect, which leaves a hole in the server HTML and shifts layout when three
 * Anton digits appear at 80px); the count is gated on the reduced-motion media
 * query read inside the effect. Upstream prop defaults are untouched.
 */

import { useInView, useMotionValue, useSpring } from "motion/react";
import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { prefersReducedMotion } from "@/lib/useAnim";

interface CountUpProps {
  to: number;
  from?: number;
  direction?: "up" | "down";
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
  separator?: string;
  /** The finished, formatted value. Rendered on the server and left alone
   *  under reduced motion, so the number is never missing from the HTML. */
  children: ReactNode;
}

export function CountUp({
  to,
  from = 0,
  direction = "up",
  delay = 0,
  duration = 2,
  className = "",
  startWhen = true,
  separator = "",
  children,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === "down" ? to : from);

  const damping = 20 + 40 * (1 / duration);
  const stiffness = 100 * (1 / duration);

  const springValue = useSpring(motionValue, { damping, stiffness });
  const isInView = useInView(ref, { once: true, margin: "0px" });

  const getDecimalPlaces = (num: number): number => {
    const str = num.toString();
    if (str.includes(".")) {
      const decimals = str.split(".")[1];
      if (parseInt(decimals) !== 0) return decimals.length;
    }
    return 0;
  };

  const maxDecimals = Math.max(getDecimalPlaces(from), getDecimalPlaces(to));

  const formatValue = useCallback(
    (latest: number) => {
      const hasDecimals = maxDecimals > 0;
      const formatted = Intl.NumberFormat("en-US", {
        useGrouping: !!separator,
        minimumFractionDigits: hasDecimals ? maxDecimals : 0,
        maximumFractionDigits: hasDecimals ? maxDecimals : 0,
      }).format(latest);
      return separator ? formatted.replace(/,/g, separator) : formatted;
    },
    [maxDecimals, separator],
  );

  useEffect(() => {
    if (!isInView || !startWhen || prefersReducedMotion()) return;
    const el = ref.current;
    if (!el) return;

    // Only now is the server-rendered final value replaced by the start value —
    // so a viewer who never scrolls here, or who has JS off, keeps the number.
    el.textContent = formatValue(direction === "down" ? to : from);

    const unsubscribe = springValue.on("change", (latest: number) => {
      if (ref.current) ref.current.textContent = formatValue(latest);
    });
    const timeoutId = setTimeout(() => motionValue.set(direction === "down" ? from : to), delay * 1000);

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [isInView, startWhen, springValue, motionValue, direction, from, to, delay, formatValue]);

  return (
    <span className={className} ref={ref}>
      {children}
    </span>
  );
}
