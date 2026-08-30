/**
 * Two kinetic strips scrolling in opposite directions - the brand shouting
 * its own lines. CSS-driven; both rows freeze under reduced motion (the
 * animate utilities are gated by the global reduced-motion block).
 */
import { HAND_MARK } from "../hero/logoPaths";

const TOP = ["SMASH BURGERS", "CROWN CRUST PIZZAS", "LOADED FRIES", "EVERY BATCH FROM SCRATCH"];
const BOTTOM = ["110G SMASHED TO ORDER", "STUFFED CROWN CRUST", "LIVE, LOVE, EAT", "DELIVERED ACROSS LAHORE"];

function Glyph() {
  return (
    <svg viewBox="180 100 700 900" className="mx-6 h-5 w-5 shrink-0 sm:h-6 sm:w-6" aria-hidden>
      <g transform={HAND_MARK.transform}>
        <path d={HAND_MARK.d} fill="currentColor" />
      </g>
    </svg>
  );
}

function Row({ words, reverse }: { words: string[]; reverse?: boolean }) {
  const strip = (
    <div className="flex shrink-0 items-center">
      {words.map((w) => (
        <span key={w} className="flex items-center">
          <span className="whitespace-nowrap font-display text-2xl font-bold tracking-tight sm:text-3xl">{w}</span>
          <Glyph />
        </span>
      ))}
    </div>
  );
  return (
    <div className="flex w-max" style={{ animation: `var(--animate-marquee${reverse ? "-reverse" : ""})` }}>
      {strip}
      {strip}
    </div>
  );
}

export function Marquee() {
  return (
    <div className="overflow-hidden bg-red py-5 text-cream" aria-hidden>
      <Row words={TOP} />
      <div className="mt-2 text-cream/70">
        <Row words={BOTTOM} reverse />
      </div>
    </div>
  );
}
