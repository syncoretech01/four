"use client";

import { useEffect, useRef, type RefObject } from "react";

type Gsap = typeof import("gsap")["gsap"];

/**
 * The only sanctioned way to use GSAP in this app.
 *
 * Three rules are enforced here rather than left to call sites, because each
 * one is a mistake that is invisible until it is expensive:
 *
 * 1. **Reduced motion returns before the import.** Not after — a visitor who
 *    asked for less motion should download less JavaScript, not the same
 *    bundle with the animation skipped. The preference is re-read on change,
 *    so toggling it live starts or reverts the animation.
 * 2. **GSAP is imported dynamically**, so it lands in its own chunk fetched
 *    after paint and never enters the initial bundle of a route that does not
 *    animate. This is why `@gsap/react`'s `useGSAP` is deliberately NOT used:
 *    it statically imports gsap, which would pull the library into the chunk of
 *    every module that imports the hook, and it runs in `useLayoutEffect` when
 *    what we want is setup strictly after first paint.
 * 3. **Cleanup is `context.revert()`**, which kills the tweens, kills the
 *    ScrollTriggers created inside the context, and restores every inline style
 *    GSAP wrote. That makes the effect idempotent, which is what React 19's
 *    StrictMode double-invoke needs, and it is what stops ScrollTrigger
 *    instances from surviving an App Router client navigation and measuring a
 *    document that no longer exists.
 *
 * The setup function must only ever ENHANCE content that is already visible.
 * Nothing may depend on GSAP arriving: if the chunk fails to load, the page
 * must still read correctly.
 *
 * GSAP is not permitted in anything reachable from the design-sync bundle
 * (see .design-sync/conventions.md) — the bundle inlines its runtime, and the
 * capture harness pins the page clock so a GSAP timeline would screenshot at
 * its start state.
 */
export function useGsap(
  scope: RefObject<HTMLElement | null>,
  setup: (gsap: Gsap, el: HTMLElement) => void,
  deps: unknown[] = [],
) {
  const setupRef = useRef(setup);
  setupRef.current = setup;

  useEffect(() => {
    const el = scope.current;
    if (!el) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let cancelled = false;
    let ctx: { revert: () => void } | undefined;

    const start = async () => {
      if (mq.matches) return; // no animation, and no download either
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);
      if (cancelled) return;
      ctx = gsap.context(() => setupRef.current(gsap, el), el);
    };

    const stop = () => {
      ctx?.revert();
      ctx = undefined;
    };

    const onChange = () => {
      stop();
      void start();
    };

    void start();
    mq.addEventListener("change", onChange);

    return () => {
      cancelled = true;
      mq.removeEventListener("change", onChange);
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
