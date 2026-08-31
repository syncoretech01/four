/**
 * Two kinetic strips scrolling in opposite directions - the brand shouting
 * its own lines. CSS-driven; both rows freeze under reduced motion (the
 * animate utilities are gated by the global reduced-motion block).
 *
 * Chrome is the design system's `.f-marquee` block: red ground fenced by the
 * 2px ink rule top and bottom.
 */
import { HAND_MARK } from "../hero/logoPaths";

const TOP = ["SMASH BURGERS", "CROWN CRUST PIZZAS", "LOADED FRIES", "EVERY BATCH FROM SCRATCH"];
const BOTTOM = ["110G SMASHED TO ORDER", "STUFFED CROWN CRUST", "LIVE, LOVE, EAT", "DELIVERED ACROSS LAHORE"];

function Glyph() {
  return (
    <svg viewBox="180 100 700 900" className="f-marquee__glyph" aria-hidden>
      <g transform={HAND_MARK.transform}>
        <path d={HAND_MARK.d} fill="currentColor" />
      </g>
    </svg>
  );
}

function Row({ words, reverse, dim }: { words: string[]; reverse?: boolean; dim?: boolean }) {
  const strip = (
    <div className="f-marquee__strip">
      {words.map((w) => (
        <span key={w} className="flex items-center">
          <span className="f-marquee__word">{w}</span>
          <Glyph />
        </span>
      ))}
    </div>
  );
  return (
    <div className={`f-marquee__row ${reverse ? "f-marquee__row--rev" : ""} ${dim ? "f-marquee__row--dim" : ""}`}>
      {strip}
      {strip}
    </div>
  );
}

export function Marquee() {
  return (
    <div className="f-marquee" aria-hidden>
      <Row words={TOP} />
      <div className="mt-2">
        <Row words={BOTTOM} reverse dim />
      </div>
    </div>
  );
}
