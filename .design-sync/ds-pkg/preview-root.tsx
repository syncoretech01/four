import type { ReactNode } from "react";
import { MotionGlobalConfig } from "motion/react";

/*
  Preview-only wrapper, wired as cfg.provider. Not a FOUR component and not part
  of the component list - componentSrcMap excludes it.

  It makes two things deterministic in a card. Both patches are module-scope, so
  they land before any component renders, and both affect preview cards ONLY:
  cfg.provider wraps nothing outside them, so designs built with the library get
  the real animations.

  1. prefers-reduced-motion.
     LogoHero holds its letter fills at opacity 0 behind a 1.6s timer, so a card
     screenshot caught it mid-draw - thin red outlines, no fills, tagline and
     buttons still invisible - and the exact frame varied per run.

     MotionConfig reducedMotion="always" does NOT fix this: it feeds motion's
     internal useReducedMotionConfig(), while these components call the public
     useReducedMotion() hook (via lib/useAnim), which reads the media query
     directly. So emulate the query itself.

  2. Animation progress.
     package-capture pins the page clock (page.clock.setFixedTime), so motion's
     animation loop never advances: anything that animates in from opacity 0
     stays at opacity 0 forever. HypeBand captured as a bare red band - headline,
     branch cards and buttons all present in the DOM, all invisible.

     Emulating reduced motion does not help, because useReduceMotion is
     hydration-safe: it returns false until an effect sets `mounted`, so the
     opacity-0 `initial` is applied on the very first render whatever the media
     query says, and only a running animation can clear it. skipAnimations makes
     motion jump straight to target values instead of interpolating, which is
     exactly what a still screenshot wants.

  3. IntersectionObserver.
     Story and HypeBand reveal their content with motion's whileInView. That
     needs a real intersection callback, and in a per-story capture it does not
     always arrive - HypeBand captured as a bare red band with an invisible
     headline, invisible branch cards and invisible buttons, because every
     block was still sitting at its initial opacity 0.

     Even with animations skipped, a whileInView target is only applied once an
     intersection is reported, and in a per-story capture that callback does not
     reliably arrive. So report every observed element as fully intersecting,
     immediately.
*/

MotionGlobalConfig.skipAnimations = true;

if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
  const native = window.matchMedia.bind(window);
  window.matchMedia = ((query: string) =>
    /prefers-reduced-motion/.test(query)
      ? {
          matches: true,
          media: query,
          onchange: null,
          addListener() {},
          removeListener() {},
          addEventListener() {},
          removeEventListener() {},
          dispatchEvent: () => false,
        }
      : native(query)) as typeof window.matchMedia;
}

if (typeof window !== "undefined" && "IntersectionObserver" in window) {
  class AlwaysIntersecting {
    readonly root = null;
    readonly rootMargin = "0px";
    readonly thresholds: ReadonlyArray<number> = [0];
    #callback: IntersectionObserverCallback;

    constructor(callback: IntersectionObserverCallback) {
      this.#callback = callback;
    }

    observe(target: Element) {
      const rect = target.getBoundingClientRect();
      const entry = {
        target,
        isIntersecting: true,
        intersectionRatio: 1,
        boundingClientRect: rect,
        intersectionRect: rect,
        rootBounds: null,
        time: 0,
      } as unknown as IntersectionObserverEntry;
      // Async so the caller finishes wiring up before the callback fires.
      setTimeout(() => this.#callback([entry], this as unknown as IntersectionObserver), 0);
    }

    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  window.IntersectionObserver = AlwaysIntersecting as unknown as typeof IntersectionObserver;
}

export function PreviewRoot({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}
