import type { ReactNode } from "react";

/**
 * Per-line heading rise: each authored line moves as its own block, staggered.
 *
 * The lines are passed in, never measured. That is the whole point — a
 * measuring split (GSAP SplitText and friends) has to wait for
 * `document.fonts.ready`, re-split when Anton replaces the Impact fallback, and
 * rewrite the DOM after paint. On the hero headline that is a layout shift on
 * the LCP element. Authored lines cost nothing and cannot shift.
 *
 * `mask` is an LCP decision, not a taste one. Masked lines slide out of an
 * overflow-hidden box — the more dramatic read — but text translated outside
 * its clip box is never painted, and an unpainted element is not an LCP
 * candidate. So the mask is only for headings that are definitely not the LCP
 * element; the hero keeps its text painted throughout and staggers the lines.
 *
 * Renders no wrapper of its own so it can be dropped straight into a heading.
 */
export function LineRise({
  lines,
  delay = 0,
  stagger = 0.09,
  mask = false,
}: {
  lines: ReactNode[];
  /** Seconds before the first line moves. */
  delay?: number;
  /** Seconds between lines. */
  stagger?: number;
  /** Slide out of a clipping box. Never on an element that could be the LCP one. */
  mask?: boolean;
}) {
  return (
    <>
      {lines.map((line, i) => (
        <span key={i} className={mask ? "f-linerise" : "f-lineup"}>
          <span style={{ "--rise-delay": `${delay + i * stagger}s` } as React.CSSProperties}>{line}</span>
        </span>
      ))}
    </>
  );
}
