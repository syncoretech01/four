"use client";

import { useEffect, useState } from "react";
import { RotatingText } from "../rb/RotatingText";
import { useReduceMotion } from "@/lib/useAnim";

/**
 * The city name at the head of the "…flavours. One Lahore address." headline,
 * cycling through the cities the menu actually names.
 *
 * Driven by the real menu data, so it can never advertise a city the board does
 * not carry. The sentence stays true at every step — each city's flavour, one
 * Lahore address — which is why the rotation sits here and not on "Lahore".
 *
 * Renders the first city as plain text on the server and swaps to the animated
 * version after mount. That is not ceremony: the rotator gives every character
 * an `initial={{opacity: 0}}`, and motion writes `initial` into the *server*
 * inline style, which would put a headline into the HTML that is invisible
 * without JS. Under reduced motion the plain text simply stays.
 *
 * `min-width` is pinned to the longest city so a heading that fits on one line
 * never re-wraps mid-cycle.
 */
export function RotatingCity({ cities }: { cities: string[] }) {
  const reduce = useReduceMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // The full stop rides along with each city: anything rendered after the
  // rotator would be pushed sideways every time the word changes width.
  const texts = cities.map((c) => `${c}.`);
  const longest = texts.reduce((a, b) => (b.length > a.length ? b : a), "");
  const style = { minWidth: `${longest.length}ch`, textAlign: "left" as const };

  if (!mounted || reduce || texts.length < 2) {
    return <span style={{ ...style, display: "inline-block" }}>{texts[0]}</span>;
  }

  return (
    <RotatingText
      texts={texts}
      style={style}
      mainClassName="inline-flex align-bottom"
      splitBy="characters"
      staggerFrom="first"
      staggerDuration={0.02}
      rotationInterval={2600}
      transition={{ type: "spring", damping: 28, stiffness: 320 }}
      initial={{ y: "100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "-110%", opacity: 0 }}
    />
  );
}
