import { Marquee } from "@four/ui";

/**
 * Full-bleed by design - no horizontal padding, no max-width. The strip below
 * is static in a screenshot; live it scrolls its two rendered rows on a 30s
 * linear loop, and collapses under prefers-reduced-motion.
 */
export const Default = () => (
  <div className="bg-beige py-10">
    <Marquee />
  </div>
);

/** How it actually sits on the page: a divider between two beige sections. */
export const BetweenSections = () => (
  <div className="bg-beige">
    <div className="px-8 py-10 text-center">
      <p className="font-display text-2xl font-semibold text-ink">Section above</p>
    </div>
    <Marquee />
    <div className="px-8 py-10 text-center">
      <p className="font-display text-2xl font-semibold text-ink">Section below</p>
    </div>
  </div>
);
