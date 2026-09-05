import { formatPKR } from "@four/shared";

/**
 * A price. Two variants, and the difference is a rationing decision rather than
 * a taste one.
 *
 * `type` (the default) sets the figure in Anton on the card's own ground. It is
 * how a premium menu sets a price, and it is what keeps 56 of them on /menu from
 * turning the page burgundy by accumulation.
 *
 * `chip` is the filled burgundy block with yellow digits, reserved for deal
 * cards — where a struck-through price sits beside it and the block earns its
 * loudness by meaning "this one is discounted".
 */
export function PriceTag({
  price,
  from = false,
  variant = "type",
  className = "",
}: {
  price: number;
  /** Prefix the figure with "from" — for items whose cheapest variant this is. */
  from?: boolean;
  variant?: "type" | "chip";
  className?: string;
}) {
  return (
    <span className={`f-item__price ${variant === "chip" ? "f-item__price--chip" : ""} ${className}`.trim()}>
      {from && <span className="f-item__from">from</span>}
      {formatPKR(price)}
    </span>
  );
}
