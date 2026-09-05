import { formatPKR } from "@four/shared";

/** The red price square with yellow Anton digits (auto width — "Rs. 1,299" is wider than Dinevo's "$99"). */
export function PriceTag({ price, from = false, className = "" }: { price: number; from?: boolean; className?: string }) {
  return (
    <span className={`f-item__price ${className}`.trim()}>
      {from && <span className="f-item__from">from</span>}
      {formatPKR(price)}
    </span>
  );
}
