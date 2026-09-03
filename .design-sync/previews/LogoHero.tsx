import { LogoHero } from "@four/ui";

/**
 * The whole v3 hero: the red type block (proof row, Anton headline with the
 * yellow highlight and two stickers, lede, pill CTAs) and the four-photo
 * strip that hangs into the white section below. The strip's photos are
 * storefront-owned /hero/strip-*.jpg paths that do not resolve inside a
 * design, so each tile falls back to SmartImage's beige tile - the designed
 * degradation, not a missing asset. Reduced motion is forced by the preview
 * provider, so the staggered reveals are shown settled.
 */
export const Default = () => (
  <div className="bg-white">
    <LogoHero />
  </div>
);
