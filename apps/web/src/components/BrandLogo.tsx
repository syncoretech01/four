import { LOGO_VIEWBOX, LETTER_F, LETTER_O, LETTER_U, LETTER_R } from "./hero/logoPaths";

/**
 * The exact FOUR wordmark from the brand kit, inlined as vectors so it
 * renders crisp at any size. The artwork sits in the middle band of the
 * 1080-square logo page, so we crop the viewBox to the wordmark bounds.
 */
export function BrandLogo({ className = "h-8", title = "FOUR" }: { className?: string; title?: string }) {
  void LOGO_VIEWBOX;
  return (
    <svg viewBox="95 355 890 310" className={className} role="img" aria-label={title}>
      {[LETTER_F, LETTER_O, LETTER_U, LETTER_R].map((p, i) => (
        <path key={i} transform={p.transform} d={p.d} fill="currentColor" />
      ))}
    </svg>
  );
}
