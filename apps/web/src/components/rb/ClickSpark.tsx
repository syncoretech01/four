"use client";

/**
 * Vendored from react-bits (MIT + Commons Clause),
 * src/ts-tailwind/Animations/ClickSpark/ClickSpark.tsx, fetched 2026-09-04.
 *
 * The spark geometry and easing are upstream's, unchanged. Everything around
 * them is adapted, and each change is load-bearing:
 *
 * 1. **Driven imperatively, not by a wrapping click handler.** Upstream is a
 *    div that sparks on any click inside it. Wrapping 56 dish cards would mean
 *    56 canvases; wrapping the app would spark on every stray click, including
 *    the cart scrim. It now takes a `subscribe` function and one canvas is
 *    mounted for the whole app.
 * 2. **The rAF loop stops when there is nothing to draw.** Upstream calls
 *    `requestAnimationFrame` unconditionally and forever — a permanent
 *    main-thread wake-up on every page, which is not acceptable on the phones
 *    this site is ordered from. The loop now starts on a spark and ends with
 *    the last one.
 * 3. **Sized to the viewport and DPR-scaled**, so bursts land at the right
 *    place on a retina screen instead of at half scale.
 * 4. "use client"; named export.
 */

import { useEffect, useRef } from "react";

interface Spark {
  x: number;
  y: number;
  angle: number;
  startTime: number;
}

export function ClickSpark({
  subscribe,
  sparkColor = "#fff",
  sparkSize = 10,
  sparkRadius = 15,
  sparkCount = 8,
  duration = 400,
  easing = "ease-out",
  extraScale = 1.0,
  className = "",
}: {
  /** Registers the burst callback; returns an unsubscribe. */
  subscribe: (fn: (x: number, y: number) => void) => () => void;
  sparkColor?: string;
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
  easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
  extraScale?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<Spark[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const ease = (t: number) => {
      switch (easing) {
        case "linear":
          return t;
        case "ease-in":
          return t * t;
        case "ease-in-out":
          return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        default:
          return t * (2 - t);
      }
    };

    const draw = (timestamp: number) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      sparksRef.current = sparksRef.current.filter((s) => {
        const elapsed = timestamp - s.startTime;
        if (elapsed >= duration) return false;

        const eased = ease(elapsed / duration);
        const distance = eased * sparkRadius * extraScale;
        const lineLength = sparkSize * (1 - eased);

        ctx.strokeStyle = sparkColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.x + distance * Math.cos(s.angle), s.y + distance * Math.sin(s.angle));
        ctx.lineTo(s.x + (distance + lineLength) * Math.cos(s.angle), s.y + (distance + lineLength) * Math.sin(s.angle));
        ctx.stroke();
        return true;
      });

      // The loop ends with the last spark — see note 2.
      rafRef.current = sparksRef.current.length ? requestAnimationFrame(draw) : null;
    };

    const unsubscribe = subscribe((x, y) => {
      const now = performance.now();
      for (let i = 0; i < sparkCount; i++) {
        sparksRef.current.push({ x, y, angle: (2 * Math.PI * i) / sparkCount, startTime: now });
      }
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(draw);
    });

    return () => {
      unsubscribe();
      window.removeEventListener("resize", resize);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      sparksRef.current = [];
    };
  }, [subscribe, sparkColor, sparkSize, sparkRadius, sparkCount, duration, easing, extraScale]);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}
