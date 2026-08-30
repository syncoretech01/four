/**
 * FOUR branches and the delivery areas each one serves. Orders are routed
 * to the branch covering the customer's area; the kitchen console and the
 * rider app are branch-scoped.
 */

export interface BranchData {
  id: string;
  name: string;
  shortName: string;
  address: string;
  lat: number;
  lng: number;
  /** Area ids (see areas.ts) this branch delivers to. */
  areaIds: string[];
}

export const BRANCHES: BranchData[] = [
  {
    id: "fairways-dha6",
    name: "FOUR Fairways - DHA Phase 6",
    shortName: "Fairways",
    address: "Fairways Commercial, Sector M, DHA Phase 6 (Raya), Lahore",
    lat: 31.4585,
    lng: 74.4448,
    areaIds: [
      "dha-phase-1", "dha-phase-2", "dha-phase-3", "dha-phase-4", "dha-phase-5",
      "dha-phase-6", "dha-phase-7", "dha-phase-8", "cantt", "gulberg-1",
      "gulberg-2", "gulberg-3", "model-town", "garden-town", "shadman", "faisal-town",
    ],
  },
  {
    id: "allama-iqbal-town",
    name: "FOUR Allama Iqbal Town",
    shortName: "Iqbal Town",
    address: "Main Boulevard, Allama Iqbal Town, Lahore",
    lat: 31.5102,
    lng: 74.2811,
    areaIds: ["allama-iqbal-town", "samanabad", "gulshan-e-ravi", "johar-town", "township"],
  },
  {
    id: "lake-city",
    name: "FOUR Lake City",
    shortName: "Lake City",
    address: "Lake City Boulevard, Raiwind Road, Lahore",
    lat: 31.3670,
    lng: 74.2223,
    areaIds: ["lake-city", "valencia-town", "bahria-town", "wapda-town"],
  },
];

export function branchForArea(areaId: string): BranchData {
  return BRANCHES.find((b) => b.areaIds.includes(areaId)) ?? BRANCHES[0];
}

/** Approximate centroids for delivery areas (destination pin + ETA hints). */
export const AREA_COORDS: Record<string, { lat: number; lng: number }> = {
  "dha-phase-1": { lat: 31.4794, lng: 74.4023 },
  "dha-phase-2": { lat: 31.4722, lng: 74.4181 },
  "dha-phase-3": { lat: 31.4802, lng: 74.3805 },
  "dha-phase-4": { lat: 31.4652, lng: 74.3979 },
  "dha-phase-5": { lat: 31.4593, lng: 74.4211 },
  "dha-phase-6": { lat: 31.4622, lng: 74.4463 },
  "dha-phase-7": { lat: 31.4515, lng: 74.4757 },
  "dha-phase-8": { lat: 31.4839, lng: 74.4547 },
  "model-town": { lat: 31.4832, lng: 74.3239 },
  "gulberg-1": { lat: 31.5266, lng: 74.3556 },
  "gulberg-2": { lat: 31.5204, lng: 74.3487 },
  "gulberg-3": { lat: 31.5091, lng: 74.3413 },
  "allama-iqbal-town": { lat: 31.5102, lng: 74.2811 },
  "johar-town": { lat: 31.4697, lng: 74.2728 },
  "wapda-town": { lat: 31.4353, lng: 74.2543 },
  "faisal-town": { lat: 31.4794, lng: 74.3011 },
  "garden-town": { lat: 31.4989, lng: 74.3062 },
  township: { lat: 31.4512, lng: 74.3082 },
  "valencia-town": { lat: 31.4013, lng: 74.2582 },
  "bahria-town": { lat: 31.3684, lng: 74.1855 },
  cantt: { lat: 31.5420, lng: 74.3860 },
  "gulshan-e-ravi": { lat: 31.5535, lng: 74.2837 },
  samanabad: { lat: 31.5406, lng: 74.3005 },
  shadman: { lat: 31.5352, lng: 74.3238 },
  "lake-city": { lat: 31.3670, lng: 74.2223 },
};

export const LAHORE_CENTER = { lat: 31.4832, lng: 74.3439 };

export function areaCoords(areaId: string): { lat: number; lng: number } {
  return AREA_COORDS[areaId] ?? LAHORE_CENTER;
}
