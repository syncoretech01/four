/** FOUR brand + commerce constants. Colors/fonts come from the official brand book. */

export const BRAND = {
  name: "FOUR",
  beige: "#E9DCC5",
  red: "#9D1D20",
  white: "#FFFFFF",
  /** Fairways Commercial, Sector M, DHA Phase 6 (Raya), Lahore */
  address: "Fairways Commercial, DHA Phase 6, Lahore",
  instagram: "https://www.instagram.com/four.pakistan",
} as const;

export const DELIVERY_FEE = 149; // PKR - confirm with operations
export const FREE_DELIVERY_ABOVE = 2500; // PKR - confirm with operations

/**
 * Menu prices are exclusive of tax (printed on the menu). Punjab restaurant
 * sales tax differs by payment method; both rates are env-overridable.
 */
export const DEFAULT_TAX_RATE_COD = 0.16;
export const DEFAULT_TAX_RATE_CARD = 0.05;

export const ORDER_STATUS_FLOW = [
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

export type OrderStatusName = (typeof ORDER_STATUS_FLOW)[number] | "CANCELLED";

export const ORDER_STATUS_LABELS: Record<OrderStatusName, string> = {
  CONFIRMED: "Order confirmed",
  PREPARING: "In the kitchen",
  OUT_FOR_DELIVERY: "Rider on the way",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export function formatPKR(n: number): string {
  return `Rs. ${Math.round(n).toLocaleString("en-PK")}`;
}
