import { BrandLogo } from "../BrandLogo";
import { HAND_MARK } from "../hero/logoPaths";

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
 * Pauses on hover; frozen entirely under reduced motion (base.css).
 */
export function Ticker({ repeat = 4 }: { repeat?: number }) {
  const strip = (
    <div className="f-marquee__strip">
      {Array.from({ length: repeat }).map((_, i) => (
        <span key={i} className="f-marquee__strip">
          <BrandLogo className="f-marquee__logo" title="" />
          <HandGlyph className="f-marquee__glyph" />
          <span className="f-marquee__word f-marquee__word--outline">Live, Love, Eat</span>
          <HandGlyph className="f-marquee__glyph" />
        </span>
      ))}
    </div>
  );
  return (
    <div className="f-marquee" aria-hidden>
      <div className="f-marquee__row">
        {strip}
        {strip}
      </div>
    </div>
  );
}
