"use client";

import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "../BrandLogo";
import { HAND_MARK } from "../hero/logoPaths";
import { ScrollVelocityRow } from "../rb/ScrollVelocity";
import { useReduceMotion } from "@/lib/useAnim";

function HandGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="180 100 700 900" className={className} aria-hidden>
      <g transform={HAND_MARK.transform}>
        <path d={HAND_MARK.d} fill="currentColor" />
      </g>
    </svg>
  );
}

/**
 * The giant footer ticker. One unit = the real wordmark (white on red, an
 * approved lockup) · the hand mark · "LIVE, LOVE, EAT" (the tagline printed on
 * the cups and trays) set outlined in Anton · the hand mark. The wordmark is
 * never stroked, recoloured or rotated; the tagline is typography, not the mark.
 *
 * Two drivers, and which one runs is a budget decision.
 *
 * The un-enhanced state is the CSS marquee at `--marquee-duration` — that is
 * what the server renders, what a reduced-motion visitor keeps (frozen by
 * base.css) and what runs with JS off. On top of that, while the strip is
 * actually on screen and the tab is in the foreground, a scroll-velocity driver
 * takes over: scrolling down speeds it up, scrolling up reverses it.
 *
 * The driver is *unmounted* rather than idled when the footer scrolls away. It
 * runs an animation frame callback, this component is on every page, and a
 * permanent main-thread wake-up is not something to spend on a decorative strip
 * on a phone. `rootMargin` starts it early so the hand-off happens off screen.
 */
export function Ticker({ repeat = 4 }: { repeat?: number }) {
  const reduce = useReduceMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const el = hostRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver((entries) => setOnScreen(entries[0]?.isIntersecting ?? false), {
      rootMargin: "200px 0px",
    });
    io.observe(el);

    const onVisibility = () => setTabVisible(document.visibilityState === "visible");
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const strip = (
    <span className="f-marquee__strip">
      {Array.from({ length: repeat }).map((_, i) => (
        <span key={i} className="f-marquee__strip">
          <BrandLogo className="f-marquee__logo" title="" />
          <HandGlyph className="f-marquee__glyph" />
          <span className="f-marquee__word f-marquee__word--outline">Live, Love, Eat</span>
          <HandGlyph className="f-marquee__glyph" />
        </span>
      ))}
    </span>
  );

  const driven = onScreen && tabVisible && !reduce;

  return (
    <div className="f-marquee" aria-hidden ref={hostRef}>
      {driven ? (
        <ScrollVelocityRow
          className="f-marquee__row is-driven"
          copyClassName="f-marquee__strip"
          baseVelocity={60}
          numCopies={2}
        >
          {strip}
        </ScrollVelocityRow>
      ) : (
        <div className="f-marquee__row">
          {strip}
          {strip}
        </div>
      )}
    </div>
  );
}
