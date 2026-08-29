/**
 * Delivery-time estimates. Operations set these: 30 minutes out to 5km, then a
 * minute per additional kilometre. The delivery FEE stays flat by their
 * instruction, so that is pinned here too - a distance-based fee must be a
 * deliberate change, not a drift.
 */
import { describe, expect, it } from "vitest";
import {
  BASE_DELIVERY_MINUTES,
  DELIVERY_FEE,
  FREE_RADIUS_KM,
  LAHORE_AREAS,
  deliveryEtaLabel,
  deliveryMinutesFor,
} from "@four/shared";

describe("delivery time estimate", () => {
  it("is the base time anywhere inside the free radius", () => {
    expect(deliveryMinutesFor(0)).toBe(BASE_DELIVERY_MINUTES);
    expect(deliveryMinutesFor(FREE_RADIUS_KM)).toBe(BASE_DELIVERY_MINUTES);
  });

  it("adds a minute per kilometre beyond it", () => {
    expect(deliveryMinutesFor(FREE_RADIUS_KM + 1)).toBe(BASE_DELIVERY_MINUTES + 1);
    expect(deliveryMinutesFor(FREE_RADIUS_KM + 10)).toBe(BASE_DELIVERY_MINUTES + 10);
  });

  it("never quotes less than the base time", () => {
    for (const area of LAHORE_AREAS) {
      expect(deliveryMinutesFor(area.distanceKm)).toBeGreaterThanOrEqual(BASE_DELIVERY_MINUTES);
    }
  });

  it("renders a window, not a single number", () => {
    expect(deliveryEtaLabel(0)).toBe("30-40 min");
  });
});

describe("delivery coverage data", () => {
  it("gives every area a usable distance", () => {
    for (const area of LAHORE_AREAS) {
      expect(area.distanceKm, area.name).toBeGreaterThanOrEqual(0);
      // Lahore is ~40km across; anything beyond that is a geocoding mistake
      expect(area.distanceKm, area.name).toBeLessThan(50);
    }
  });

  it("still charges one flat fee everywhere, as operations asked", () => {
    // distanceKm exists for the time estimate; switching the FEE to distance
    // is a separate decision and should fail this test when it is made
    expect(DELIVERY_FEE).toBe(149);
  });
});
