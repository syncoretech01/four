"use client";

import { CountUp } from "../rb/CountUp";

/**
 * A number that counts up as it scrolls into view.
 *
 * Reserved for the numbers the copy is actually arguing about — 110g, three
 * kitchens, 24 areas, 30 minutes. Making a verified number physically arrive
 * reinforces the sentence around it; doing it to a price or an order total
 * would just make the money look unstable, so don't.
 *
 * The width reservation sits on an outer span because `CountUp` overwrites its
 * own `textContent` on every frame — anything rendered inside it is destroyed
 * the moment counting starts. Without the reservation the unit beside the
 * number ("g", "min") slides sideways for the whole count, which is a layout
 * shift on every frame.
 *
 * `from` defaults to the same digit count as the target for the same reason:
 * counting 100 → 110 never changes width, counting 0 → 110 changes it twice.
 */
export function StatNumber({
  value,
  from,
  width,
  delay = 0,
  duration = 1.6,
  separator = "",
  className = "",
}: {
  value: number;
  from?: number;
  /** Reserved width in `ch`. Defaults to the digit count of `value`. */
  width?: number;
  delay?: number;
  duration?: number;
  separator?: string;
  className?: string;
}) {
  const digits = Math.abs(Math.trunc(value)).toString().length;
  const start = from ?? (digits > 1 ? Math.pow(10, digits - 1) : 0);
  const formatted = separator
    ? Intl.NumberFormat("en-US", { useGrouping: true }).format(value).replace(/,/g, separator)
    : String(value);

  return (
    <span
      className={className}
      style={{ display: "inline-block", minWidth: `${width ?? digits}ch`, textAlign: "left" }}
    >
      <CountUp to={value} from={start} delay={delay} duration={duration} separator={separator} className="tabular-nums">
        {formatted}
      </CountUp>
    </span>
  );
}
