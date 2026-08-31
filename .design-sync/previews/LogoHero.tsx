import { LogoHero } from "@four/ui";

/**
 * The whole storefront hero, at the width it is designed for. Shown in its
 * settled state - the preview provider forces reduced motion, so the letter
 * fills are at full opacity rather than mid-draw.
 *
 * The photo panel on the right is empty on purpose: LogoHero hardcodes
 * <img src="/gallery/gallery-3.jpg">, a storefront-owned asset with no
 * fallback, and that path does not resolve outside the app.
 */
export const Default = () => (
  <div className="bg-beige">
    <LogoHero />
  </div>
);
