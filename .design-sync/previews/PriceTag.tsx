import { PriceTag } from "@four/ui";

/** The red price square with yellow digits, auto-width for rupee amounts. */
export const Default = () => (
  <div className="flex items-center gap-5 bg-cream p-8">
    <PriceTag price={549} />
    <PriceTag price={1299} from />
  </div>
);
