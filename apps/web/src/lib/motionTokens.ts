/**
 * The JS mirror of styles/ds/tokens/motion.css.
 *
 * motion and gsap cannot read a CSS custom property, so the brand ease and the
 * durations exist twice. They were previously copy-pasted inline in three
 * components; this is the one place to change them. Keep it in step with
 * motion.css by hand — a comment there points back here.
 */

/** --ease-brand, as motion's cubic-bezier tuple. */
export const EASE_BRAND: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** --ease-brand, for anything that wants the CSS string (gsap, inline styles). */
export const EASE_BRAND_CSS = "cubic-bezier(0.16, 1, 0.3, 1)";

/** --dur-*, in seconds (motion's unit; the CSS tokens are in ms). */
export const DUR = {
  fast: 0.15,
  base: 0.3,
  slow: 0.5,
  reveal: 0.6,
  hero: 0.7,
} as const;

/** Cascade spacing, in seconds. */
export const STAGGER = {
  tight: 0.045,
  line: 0.09,
  card: 0.08,
} as const;
