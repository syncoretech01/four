import { CLOSES_AT_MINUTES, OPENS_AT_MINUTES } from "@four/shared";

/** "1pm" / "3am" from minutes-from-midnight, so copy never hard-codes the hours. */
export function hourLabel(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const suffix = h >= 12 ? "pm" : "am";
  return `${h % 12 || 12}${suffix}`;
}

export const OPENS_LABEL = hourLabel(OPENS_AT_MINUTES);
export const CLOSES_LABEL = hourLabel(CLOSES_AT_MINUTES);
