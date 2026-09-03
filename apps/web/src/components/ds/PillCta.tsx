import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";

const TONE_BTN = {
  yellow: "f-btn--primary",
  red: "f-btn--red",
  outline: "f-btn--outline",
  "on-red": "f-btn--on-red",
  card: "f-btn--secondary",
} as const;

export type PillTone = keyof typeof TONE_BTN;

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * The storefront call to action: a pill plus a separate arrow circle, as ONE
 * focusable element (a Link for internal hrefs, a plain anchor for external or
 * tel: hrefs, otherwise a button). Press feedback is CSS, so this stays
 * server-safe and keeps client-side navigation.
 */
export function PillCta({
  href,
  onClick,
  children,
  tone = "yellow",
  size = "md",
  arrow = true,
  block = false,
  loading = false,
  disabled = false,
  external = false,
  ariaLabel,
  className = "",
  type = "button",
}: {
  href?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  children: ReactNode;
  tone?: PillTone;
  size?: "sm" | "md" | "lg";
  arrow?: boolean;
  block?: boolean;
  loading?: boolean;
  disabled?: boolean;
  /** Open in a new tab (http links) — tel:/mailto: hrefs never get a target. */
  external?: boolean;
  ariaLabel?: string;
  className?: string;
  type?: "button" | "submit";
}) {
  const cls = ["f-cta", `f-cta--${tone}`, `f-cta--${size}`, block && "f-cta--block", className].filter(Boolean).join(" ");
  const inner = (
    <>
      <span className={`f-btn ${TONE_BTN[tone]} f-btn--${size}${loading ? " is-loading" : ""}`}>{children}</span>
      {arrow && (
        <span className="f-cta__arrow" aria-hidden>
          <Arrow />
        </span>
      )}
    </>
  );
  if (href && !disabled && !loading) {
    const internal = href.startsWith("/") || href.startsWith("#");
    if (internal && !external) {
      return (
        <Link href={href} className={cls} aria-label={ariaLabel} onClick={onClick}>
          {inner}
        </Link>
      );
    }
    const newTab = external && /^https?:/.test(href);
    return (
      <a
        href={href}
        className={cls}
        aria-label={ariaLabel}
        onClick={onClick}
        target={newTab ? "_blank" : undefined}
        rel={newTab ? "noopener noreferrer" : undefined}
      >
        {inner}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} aria-busy={loading || undefined} aria-label={ariaLabel} className={cls}>
      {inner}
    </button>
  );
}
