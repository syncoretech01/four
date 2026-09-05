import type { ReactNode } from "react";
import { Hi } from "./SectionHeader";

/**
 * A heading whose words arrive one after another.
 *
 * Two modes, and the choice is an LCP decision rather than a taste one:
 *
 * - `"scroll"` — each word is its own `[data-reveal]`, so the cascade rides the
 *   head-script observer already on the page instead of adding a second
 *   mechanism. It fades from `opacity: 0`, so it is only for headings **below**
 *   the fold.
 * - `"mount"` — a CSS animation that runs at first paint and moves transform
 *   only. For the page title bands, which are the first thing on the page and
 *   very often the LCP element: Chrome does not count an element at opacity 0
 *   as an LCP candidate, so a fading page title would cost the measurement.
 *
 * `highlight` is handled here rather than by `SectionHeader.highlightTitle`,
 * which can only substring-match a plain string title — once the words are
 * separate elements the title is no longer one. Matching is at word
 * granularity: any word overlapping the highlight's range in the original
 * string gets the accent colour.
 *
 * The words stay in document order as real text nodes, so the accessible name
 * is the original sentence.
 */
export function WordRise({
  text,
  highlight,
  mode = "scroll",
  delay = 0,
  stagger = 0.045,
  className,
}: {
  text: string;
  /** Substring to render in the accent colour. */
  highlight?: string;
  mode?: "scroll" | "mount";
  /** Seconds before the first word moves. */
  delay?: number;
  /** Seconds between words. */
  stagger?: number;
  className?: string;
}): ReactNode {
  const hiStart = highlight ? text.toLowerCase().indexOf(highlight.toLowerCase()) : -1;
  const hiEnd = hiStart >= 0 ? hiStart + (highlight?.length ?? 0) : -1;

  const parts = text.split(/(\s+)/);
  let offset = 0;
  let n = 0;

  return (
    <span className={className}>
      {parts.map((part, i) => {
        const start = offset;
        offset += part.length;
        if (/^\s+$/.test(part)) return part;

        const highlighted = hiStart >= 0 && start < hiEnd && start + part.length > hiStart;
        const body = highlighted ? <Hi>{part}</Hi> : part;
        const style = { [mode === "mount" ? "--rise-delay" : "--reveal-delay"]: `${delay + n++ * stagger}s` };

        return mode === "mount" ? (
          <span key={i} className="f-wordup" style={style as React.CSSProperties}>
            {body}
          </span>
        ) : (
          <span key={i} data-reveal="" className="f-wordrise" style={style as React.CSSProperties}>
            {body}
          </span>
        );
      })}
    </span>
  );
}
