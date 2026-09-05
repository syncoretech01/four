import { createElement, type ElementType, type ReactNode } from "react";

/**
 * Above-the-fold entrance: a pure-CSS rise that runs at first paint instead of
 * waiting for hydration, so it costs no client boundary and cannot strand
 * content the way a JS-driven `initial` state can.
 *
 * `fade={false}` animates transform only. That matters above the fold: Chrome
 * excludes `opacity: 0` elements from LCP candidacy, so the hero headline and
 * the two eagerly-loaded strip tiles get their entrance *and* their LCP
 * timestamp. Everything else can fade.
 */
export function Rise({
  children,
  delay = 0,
  fade = true,
  className,
  as = "div",
  ...rest
}: {
  children: ReactNode;
  /** Seconds. Staggers a cascade of siblings. */
  delay?: number;
  /** false = transform only, keeping the element LCP-eligible. */
  fade?: boolean;
  className?: string;
  as?: ElementType;
} & Record<string, unknown>) {
  const cls = ["f-rise", !fade && "f-rise--solid", className].filter(Boolean).join(" ");
  return createElement(
    as,
    {
      ...rest,
      className: cls,
      style: delay ? ({ "--rise-delay": `${delay}s` } as React.CSSProperties) : undefined,
    },
    children,
  );
}
