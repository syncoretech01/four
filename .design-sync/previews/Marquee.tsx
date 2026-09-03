import { Marquee } from "@four/ui";

/**
 * Marquee is now the giant footer ticker (an alias of Ticker): the real
 * wordmark and hand mark in white, "LIVE, LOVE, EAT" outlined in yellow.
 * Always on a red ground - both are invisible on white. Static in a card;
 * live it loops on a 40s linear track and pauses on hover.
 */
export const Default = () => (
  <div className="on-red py-6">
    <Marquee />
  </div>
);
