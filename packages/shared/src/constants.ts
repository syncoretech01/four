/** FOUR brand + commerce constants. Colors/fonts come from the official brand book. */

export const BRAND = {
  name: "FOUR",
  beige: "#E9DCC5",
  red: "#9D1D20",
  white: "#FFFFFF",
  /** Confirmed by operations, Aug 2026. */
  address: "51 Plaza Commercial, Raya, Fairways, DHA Phase 6, Sector M, Lahore 54810",
  addressShort: "Fairways, DHA Phase 6, Lahore",
  instagram: "https://www.instagram.com/fourpakistan_/",
  instagramHandle: "@fourpakistan_",
  /** Confirmed by operations. Shown wherever an order can fail. */
  phone: "0325 1231222",
  phoneHref: "tel:+923251231222",
} as const;

export const DELIVERY_FEE = 149; // PKR - confirmed with operations
export const FREE_DELIVERY_ABOVE = 2500; // PKR - confirmed with operations

/**
 * Opening hours, confirmed by operations: opens 1:00pm, closes 3:00am the
 * following morning, every day. Stored in minutes from midnight so the
 * overnight wrap is arithmetic rather than a special case.
 */
export const OPENS_AT_MINUTES = 13 * 60; // 1:00 pm
export const CLOSES_AT_MINUTES = 3 * 60; // 3:00 am next day
export const HOURS_LABEL = "Open daily 1:00 pm - 3:00 am";

/** Lahore is UTC+5 year round; the server may be in any region. */
export const LAHORE_UTC_OFFSET_MINUTES = 5 * 60;

/** True when the kitchen is open at the given instant, Lahore time. */
export function isOpenAt(date: Date = new Date()): boolean {
  const lahoreMinutes =
    (date.getUTCHours() * 60 + date.getUTCMinutes() + LAHORE_UTC_OFFSET_MINUTES) % (24 * 60);
  // the window wraps past midnight, so it is "after opening OR before closing"
  return lahoreMinutes >= OPENS_AT_MINUTES || lahoreMinutes < CLOSES_AT_MINUTES;
}

/**
 * Delivery time estimate, confirmed by operations: 30 minutes out to 5km, then
 * a minute per additional kilometre.
 *
 * The delivery FEE is deliberately not distance-based yet - operations asked to
 * hold it flat. distanceKm on each area is what a distance fee would use when
 * that is switched on.
 */
export const BASE_DELIVERY_MINUTES = 30;
export const FREE_RADIUS_KM = 5;

export function deliveryMinutesFor(distanceKm: number): number {
  if (distanceKm <= FREE_RADIUS_KM) return BASE_DELIVERY_MINUTES;
  return BASE_DELIVERY_MINUTES + Math.ceil(distanceKm - FREE_RADIUS_KM);
}

/** "30-40 min" - a window reads more honestly than a single number. */
export function deliveryEtaLabel(distanceKm: number): string {
  const mid = deliveryMinutesFor(distanceKm);
  return `${mid}-${mid + 10} min`;
}

/**
 * Menu prices are exclusive of tax (printed on the menu). Punjab restaurant
 * sales tax differs by payment method; both rates are env-overridable.
 */
export const DEFAULT_TAX_RATE_COD = 0.16;
export const DEFAULT_TAX_RATE_CARD = 0.08;

export const ORDER_STATUS_FLOW = [
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

export type OrderStatusName = (typeof ORDER_STATUS_FLOW)[number] | "CANCELLED" | "PENDING_PAYMENT";

export const ORDER_STATUS_LABELS: Record<OrderStatusName, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  CONFIRMED: "Order confirmed",
  PREPARING: "In the kitchen",
  OUT_FOR_DELIVERY: "Rider on the way",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export function formatPKR(n: number): string {
  return `Rs. ${Math.round(n).toLocaleString("en-PK")}`;
}
