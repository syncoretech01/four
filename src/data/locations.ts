/**
 * Delivery areas across Lahore with their block/phase-level sub-areas.
 * Grouped so the order popup can show an area dropdown, then a
 * block dropdown scoped to the chosen area.
 */

export interface Area {
  id: string;
  name: string;
  blocks: string[];
}

export const LAHORE_AREAS: Area[] = [
  {
    id: "dha-phase-1",
    name: "DHA Phase 1",
    blocks: ["Block A", "Block B", "Block C", "Block D", "Block E", "Block F", "Block G", "Block H", "Block J", "Block K", "Block L", "Block M", "Block N", "Block P"],
  },
  {
    id: "dha-phase-2",
    name: "DHA Phase 2",
    blocks: ["Block Q", "Block R", "Block S", "Block T", "Block U", "Block V", "Block W", "Cavalry Ground Ext."],
  },
  {
    id: "dha-phase-3",
    name: "DHA Phase 3",
    blocks: ["Block W", "Block X", "Block Y", "Block Z"],
  },
  {
    id: "dha-phase-4",
    name: "DHA Phase 4",
    blocks: ["Block AA", "Block BB", "Block CC", "Block DD", "Block EE", "Block FF", "Block GG", "Block HH", "Block JJ", "Block KK"],
  },
  {
    id: "dha-phase-5",
    name: "DHA Phase 5",
    blocks: ["Block A", "Block B", "Block C", "Block D", "Block E", "Block F", "Block G", "Block H", "Block J", "Block K", "Block L", "Block M"],
  },
  {
    id: "dha-phase-6",
    name: "DHA Phase 6",
    blocks: ["Block A", "Block B", "Block C", "Block D", "Block E", "Block F", "Block G", "Block H", "Block J", "Block K", "Block L", "Block M", "Block N", "Main Boulevard / Fairways"],
  },
  {
    id: "dha-phase-7",
    name: "DHA Phase 7",
    blocks: ["Block P", "Block Q", "Block R", "Block S", "Block T", "Block U", "Block V", "Block W", "Block X", "Block Y", "Block Z"],
  },
  {
    id: "dha-phase-8",
    name: "DHA Phase 8",
    blocks: ["Block A", "Block B", "Block C", "Block D", "Block E", "Block F", "Block G", "Block H", "Block J", "Block K", "Block L", "Block M", "Block N", "Block P", "Block Q", "Block R", "Block S", "Block T", "Block U", "Block V", "Block W", "Block X", "Block Y", "Block Z", "Ex-Air Avenue", "Ex-Park View"],
  },
  {
    id: "model-town",
    name: "Model Town",
    blocks: ["Block A", "Block B", "Block C", "Block D", "Block E", "Block F", "Block G", "Block H", "Block J", "Block K", "Block L", "Block M", "Block N", "Block P", "Block Q", "Block R", "Model Town Extension"],
  },
  {
    id: "gulberg-1",
    name: "Gulberg 1",
    blocks: ["Block A", "Block B", "Block C", "Block D", "Block E"],
  },
  {
    id: "gulberg-2",
    name: "Gulberg 2",
    blocks: ["Block A", "Block B", "Block C", "Block D", "Block E", "Block F", "Block G", "Block H", "Block K", "Block L", "Block P", "Block Q", "Block S", "Block T"],
  },
  {
    id: "gulberg-3",
    name: "Gulberg 3",
    blocks: ["Block A", "Block A1", "Block A2", "Block A3", "Block B", "Block B1", "Block B2", "Block B3", "Block C", "Block C1", "Block C2", "Block C3", "Block D", "Block D1", "Block D2", "Block E", "Block E1", "Block E2", "Block F", "Block G", "Block H", "Block J", "Block K", "Block L", "Block M", "MM Alam Road", "Liberty Market"],
  },
  {
    id: "allama-iqbal-town",
    name: "Allama Iqbal Town",
    blocks: ["Nargis Block", "Raza Block", "Ravi Block", "Karim Block", "Nishtar Block", "Umar Block", "Asif Block", "College Block", "Chenab Block", "Sutlej Block", "Kamran Block", "Muslim Block", "Zeenat Block", "Pak Block", "Mehran Block", "Neelam Block", "Badar Block", "Gulshan Block", "Huma Block", "Jahanzeb Block", "Kashmir Block", "Khyber Block", "Sikandar Block", "Hunza Block", "Satluj Block", "Rachna Block"],
  },
  {
    id: "johar-town",
    name: "Johar Town",
    blocks: ["Block A", "Block B", "Block C", "Block D", "Block E1", "Block E2", "Block F1", "Block F2", "Block G1", "Block G2", "Block G3", "Block G4", "Block H", "Block H1", "Block H2", "Block H3", "Block J1", "Block J2", "Block J3", "Block K", "Block L", "Block M", "Block N", "Block P", "Block Q", "Block R1", "Block R2", "Block R3"],
  },
  {
    id: "wapda-town",
    name: "Wapda Town",
    blocks: ["Phase 1 - Block A", "Phase 1 - Block B", "Phase 1 - Block C", "Phase 1 - Block D", "Phase 1 - Block E1", "Phase 1 - Block E2", "Phase 1 - Block F1", "Phase 1 - Block F2", "Phase 1 - Block G", "Phase 1 - Block H", "Phase 1 - Block J1", "Phase 1 - Block J2", "Phase 1 - Block J3", "Phase 1 - Block K1", "Phase 1 - Block K2", "Phase 1 - Block K3", "Phase 2 - Block N1", "Phase 2 - Block N2", "Phase 2 - Block N3", "Phase 2 - Block N4", "Phase 2 - Block P1", "Phase 2 - Block P2", "Phase 2 - Block Q1", "Phase 2 - Block Q2"],
  },
  {
    id: "faisal-town",
    name: "Faisal Town",
    blocks: ["Block A", "Block B", "Block C", "Block C1", "Block D"],
  },
  {
    id: "garden-town",
    name: "Garden Town",
    blocks: ["Abu Bakar Block", "Ali Block", "Aurangzaib Block", "Babar Block", "Ahmed Block", "Atta Turk Block", "Sher Shah Block", "Tariq Block", "Tipu Block", "Usman Block"],
  },
  {
    id: "township",
    name: "Township",
    blocks: ["Sector A1", "Sector A2", "Sector B1", "Sector B2", "Sector C1", "Sector C2", "Sector D1", "Sector D2"],
  },
  {
    id: "valencia-town",
    name: "Valencia Town",
    blocks: ["Block A", "Block A1", "Block B", "Block C", "Block C1", "Block D", "Block E", "Block E1", "Block F", "Block F1", "Block G", "Block H", "Block J", "Block K", "Block L", "Block M", "Block P"],
  },
  {
    id: "bahria-town",
    name: "Bahria Town Lahore",
    blocks: ["Sector A", "Sector B", "Sector C", "Sector D", "Sector E", "Sector F", "Ghaznavi Block", "Iqbal Block", "Jasmine Block", "Nishtar Block", "Overseas A", "Overseas B", "Quaid Block", "Rafi Block", "Shershah Block", "Tipu Sultan Block", "Tulip Block", "Umar Block", "Usman Block"],
  },
  {
    id: "cantt",
    name: "Lahore Cantt",
    blocks: ["Saddar", "Sarwar Road", "Tufail Road", "Zarrar Shaheed Road", "Cavalry Ground", "Askari 1", "Askari 5", "Askari 9", "Askari 10", "Askari 11"],
  },
  {
    id: "gulshan-e-ravi",
    name: "Gulshan-e-Ravi",
    blocks: ["Block A", "Block B", "Block C", "Block D", "Block E", "Block F", "Block G", "Block H"],
  },
  {
    id: "samanabad",
    name: "Samanabad",
    blocks: ["Main Samanabad", "Poonch Road", "Chauburji", "Multan Chungi"],
  },
  {
    id: "shadman",
    name: "Shadman",
    blocks: ["Shadman 1", "Shadman 2", "Shadman Market"],
  },
];

export interface DeliveryLocation {
  areaId: string;
  areaName: string;
  block: string;
}

export function findArea(id: string): Area | undefined {
  return LAHORE_AREAS.find((a) => a.id === id);
}
