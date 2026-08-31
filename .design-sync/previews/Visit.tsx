import { Visit } from "@four/ui";

/**
 * The dark closing panel, full width on the beige page ground. Address, phone,
 * hours and Instagram all come from the shared BRAND constants, so the card
 * shows the real storefront details.
 */
export const Default = () => (
  <div className="bg-beige">
    <Visit />
  </div>
);
