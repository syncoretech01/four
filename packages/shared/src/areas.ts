/** Lahore delivery coverage: areas with block/sector-level sub-areas. */

export interface AreaData {
  id: string;
  name: string;
  blocks: string[];
}

const letterBlocks = (letters: string): string[] => letters.split(" ").map((l) => `Block ${l}`);

export const LAHORE_AREAS: AreaData[] = [
  { id: "dha-phase-1", name: "DHA Phase 1", blocks: letterBlocks("A B C D E F G H J K L M N P") },
  { id: "dha-phase-2", name: "DHA Phase 2", blocks: [...letterBlocks("Q R S T U V W"), "Cavalry Ground Ext."] },
  { id: "dha-phase-3", name: "DHA Phase 3", blocks: letterBlocks("W X Y Z") },
  { id: "dha-phase-4", name: "DHA Phase 4", blocks: letterBlocks("AA BB CC DD EE FF GG HH JJ KK") },
  { id: "dha-phase-5", name: "DHA Phase 5", blocks: letterBlocks("A B C D E F G H J K L M") },
  { id: "dha-phase-6", name: "DHA Phase 6", blocks: [...letterBlocks("A B C D E F G H J K L M N"), "Main Boulevard / Fairways"] },
  { id: "dha-phase-7", name: "DHA Phase 7", blocks: letterBlocks("P Q R S T U V W X Y Z") },
  { id: "dha-phase-8", name: "DHA Phase 8", blocks: [...letterBlocks("A B C D E F G H J K L M N P Q R S T U V W X Y Z"), "Ex-Air Avenue", "Ex-Park View"] },
  { id: "model-town", name: "Model Town", blocks: [...letterBlocks("A B C D E F G H J K L M N P Q R"), "Model Town Extension"] },
  { id: "gulberg-1", name: "Gulberg 1", blocks: letterBlocks("A B C D E") },
  { id: "gulberg-2", name: "Gulberg 2", blocks: letterBlocks("A B C D E F G H K L P Q S T") },
  {
    id: "gulberg-3",
    name: "Gulberg 3",
    blocks: [...letterBlocks("A A1 A2 A3 B B1 B2 B3 C C1 C2 C3 D D1 D2 E E1 E2 F G H J K L M"), "MM Alam Road", "Liberty Market"],
  },
  {
    id: "allama-iqbal-town",
    name: "Allama Iqbal Town",
    blocks: [
      "Nargis Block", "Raza Block", "Ravi Block", "Karim Block", "Nishtar Block", "Umar Block", "Asif Block",
      "College Block", "Chenab Block", "Sutlej Block", "Kamran Block", "Muslim Block", "Zeenat Block", "Pak Block",
      "Mehran Block", "Neelam Block", "Badar Block", "Gulshan Block", "Huma Block", "Jahanzeb Block",
      "Kashmir Block", "Khyber Block", "Sikandar Block", "Hunza Block", "Rachna Block",
    ],
  },
  {
    id: "johar-town",
    name: "Johar Town",
    blocks: letterBlocks("A B C D E1 E2 F1 F2 G1 G2 G3 G4 H H1 H2 H3 J1 J2 J3 K L M N P Q R1 R2 R3"),
  },
  {
    id: "wapda-town",
    name: "Wapda Town",
    blocks: [
      "Phase 1 - Block A", "Phase 1 - Block B", "Phase 1 - Block C", "Phase 1 - Block D", "Phase 1 - Block E1",
      "Phase 1 - Block E2", "Phase 1 - Block F1", "Phase 1 - Block F2", "Phase 1 - Block G", "Phase 1 - Block H",
      "Phase 1 - Block J1", "Phase 1 - Block J2", "Phase 1 - Block J3", "Phase 1 - Block K1", "Phase 1 - Block K2",
      "Phase 1 - Block K3", "Phase 2 - Block N1", "Phase 2 - Block N2", "Phase 2 - Block N3", "Phase 2 - Block N4",
      "Phase 2 - Block P1", "Phase 2 - Block P2", "Phase 2 - Block Q1", "Phase 2 - Block Q2",
    ],
  },
  { id: "faisal-town", name: "Faisal Town", blocks: letterBlocks("A B C C1 D") },
  {
    id: "garden-town",
    name: "Garden Town",
    blocks: [
      "Abu Bakar Block", "Ali Block", "Aurangzaib Block", "Babar Block", "Ahmed Block", "Atta Turk Block",
      "Sher Shah Block", "Tariq Block", "Tipu Block", "Usman Block",
    ],
  },
  { id: "township", name: "Township", blocks: ["Sector A1", "Sector A2", "Sector B1", "Sector B2", "Sector C1", "Sector C2", "Sector D1", "Sector D2"] },
  { id: "valencia-town", name: "Valencia Town", blocks: letterBlocks("A A1 B C C1 D E E1 F F1 G H J K L M P") },
  {
    id: "bahria-town",
    name: "Bahria Town Lahore",
    blocks: [
      "Sector A", "Sector B", "Sector C", "Sector D", "Sector E", "Sector F", "Ghaznavi Block", "Iqbal Block",
      "Jasmine Block", "Nishtar Block", "Overseas A", "Overseas B", "Quaid Block", "Rafi Block", "Shershah Block",
      "Tipu Sultan Block", "Tulip Block", "Umar Block", "Usman Block",
    ],
  },
  {
    id: "cantt",
    name: "Lahore Cantt",
    blocks: [
      "Saddar", "Sarwar Road", "Tufail Road", "Zarrar Shaheed Road", "Cavalry Ground",
      "Askari 1", "Askari 5", "Askari 9", "Askari 10", "Askari 11",
    ],
  },
  { id: "gulshan-e-ravi", name: "Gulshan-e-Ravi", blocks: letterBlocks("A B C D E F G H") },
  { id: "samanabad", name: "Samanabad", blocks: ["Main Samanabad", "Poonch Road", "Chauburji", "Multan Chungi"] },
  {
    id: "lake-city",
    name: "Lake City",
    blocks: ["Sector M1", "Sector M2", "Sector M2A", "Sector M3", "Sector M3A", "Sector M4", "Sector M5", "Sector M6", "Sector M7", "Sector M7B", "Sector M8"],
  },
  { id: "shadman", name: "Shadman", blocks: ["Shadman 1", "Shadman 2", "Shadman Market"] },
];
