"use client";

/**
 * Vendored from react-bits (MIT + Commons Clause),
 * src/ts-tailwind/TextAnimations/ScrollVelocity/ScrollVelocity.tsx, fetched
 * 2026-09-04.
 *
 * The velocity maths — spring-smoothed scroll velocity, the direction flip, the
 * `wrap` modulo — is upstream's, unchanged. Three adaptations:
 *
 * 1. **`VelocityText` is hoisted to module scope.** Upstream declares it inside
 *    the parent component body, so it is a brand-new component type on every
 *    render: React unmounts and remounts the whole subtree, losing the scroll
 *    position and re-running the effects each time.
 * 2. **Exported as a single row that takes children**, rather than a `texts[]`
 *    array wrapped in its own `<section>`, so the caller keeps ownership of the
 *    markup and the classes. Upstream's hardcoded `text-4xl font-bold` sizing
 *    is dropped for the same reason — `.f-marquee__word` owns that.
 * 3. **Nothing gates the animation frame upstream.** The caller must only mount
 *    this while it is on screen and the tab is visible; `ds/Ticker` does. The
 *    footer is on every page, so an ungated rAF here would be a permanent
 *    main-thread wake-up on a phone.
 */

import { useRef, useLayoutEffect, useState, type ReactNode } from "react";
import { motion, useScroll, useSpring, useTransform, useMotionValue, useVelocity, useAnimationFrame } from "motion/react";

interface VelocityMapping {
  input: [number, number];
  output: [number, number];
}

function useElementWidth<T extends HTMLElement>(ref: React.RefObject<T | null>): number {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const updateWidth = () => {
      if (ref.current) setWidth(ref.current.offsetWidth);
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [ref]);
  return width;
}

function wrap(min: number, max: number, v: number): number {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
}

/**
 * One horizontally scrolling row whose speed and direction follow the page's
 * scroll velocity. `children` is rendered `numCopies` times; the first copy is
 * measured to find the wrap distance, so every copy must be identical.
 */
export function ScrollVelocityRow({
  children,
  baseVelocity = 100,
  className = "",
  copyClassName = "",
  damping = 50,
  stiffness = 400,
  numCopies = 3,
  velocityMapping = { input: [0, 1000], output: [0, 5] },
}: {
  children: ReactNode;
  baseVelocity?: number;
  className?: string;
  copyClassName?: string;
  damping?: number;
  stiffness?: number;
  numCopies?: number;
  velocityMapping?: VelocityMapping;
}) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping, stiffness });
  const velocityFactor = useTransform(smoothVelocity, velocityMapping.input, velocityMapping.output, { clamp: false });

  const copyRef = useRef<HTMLSpanElement>(null);
  const copyWidth = useElementWidth(copyRef);

  const x = useTransform(baseX, (v) => (copyWidth === 0 ? "0px" : `${wrap(-copyWidth, 0, v)}px`));

  const directionFactor = useRef<number>(1);
  useAnimationFrame((_t, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);
    const factor = velocityFactor.get();
    if (factor < 0) directionFactor.current = -1;
    else if (factor > 0) directionFactor.current = 1;
    moveBy += directionFactor.current * moveBy * factor;
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <motion.div className={className} style={{ x }}>
      {Array.from({ length: numCopies }).map((_, i) => (
        <span key={i} className={copyClassName} ref={i === 0 ? copyRef : null}>
          {children}
        </span>
      ))}
    </motion.div>
  );
}
