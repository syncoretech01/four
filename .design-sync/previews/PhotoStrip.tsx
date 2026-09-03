import { PhotoStrip } from "@four/ui";

/**
 * The four-tile strip that hangs from the hero into the next section. Its
 * photos are storefront-owned /hero/strip-*.jpg paths, so inside a design
 * every tile shows SmartImage's beige fallback - the designed degradation.
 */
export const Default = () => (
  <div className="bg-white">
    <div className="on-red h-56" />
    <PhotoStrip />
  </div>
);
