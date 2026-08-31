import { Story } from "@four/ui";

/**
 * The about section at full width. Its two photographs are storefront-owned
 * /gallery paths, so they land on SmartImage's branded fallback tiles - the
 * warm beige gradient carrying F and O. That is the intended appearance in a
 * design, not a missing asset.
 */
export const Default = () => (
  <div className="bg-beige">
    <Story />
  </div>
);
