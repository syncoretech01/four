import { createElement, type ElementType, type ReactNode } from "react";

/**
 * Below-the-fold scroll entry: fade + 24px rise, once.
 *
 * A server component with no JavaScript of its own. It marks the element
 * `data-reveal`; the CSS in styles/ds/components/components.css hides it *only*
 * while `[data-reveal-js]` is set on <html>, and the head script that sets that
 * gate (lib/revealRuntime.ts) is the same one that arms the observer clearing
 * it. So the finished state is what ships in the SSR HTML and what survives
 * JS-off, an old browser or a thrown exception.
 *
 * Above the fold use `Rise` instead — this one starts at opacity 0, which makes
 * an element ineligible as an LCP candidate in Chrome.
 *
 * Do not pass a `transform` or `opacity` utility class to this component: these
 * rules live in @layer components, so a Tailwind utility would win and strand
 * the element in its start state.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  /** Seconds. Staggers a cascade of sibling reveals. */
  delay?: number;
  className?: string;
  as?: ElementType;
}) {
  return createElement(
    as,
    {
      "data-reveal": "",
      className,
      style: delay ? ({ "--reveal-delay": `${delay}s` } as React.CSSProperties) : undefined,
    },
    children,
  );
}
