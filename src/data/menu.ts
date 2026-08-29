/**
 * FOUR menu data. Items and prices sourced from FOUR's public listings
 * (foodpanda / fourmenu.pk) as of Aug 2026. Prices in PKR.
 *
 * NOTE FOR THE TEAM: confirm prices against the live POS before launch;
 * anything marked `verify: true` was not found in a public listing and
 * needs a real price. Image paths point at /public/menu — drop the real
 * food photography from the brand Drive folder there using the same
 * file names (see public/menu/README.md).
 */

export interface MenuVariant {
  id: string;
  label: string; // e.g. "Single", "Double", "Small", "Large"
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: CategoryId;
  description: string;
  price: number; // base price (first variant when variants exist)
  variants?: MenuVariant[];
  image: string; // real photo slot under /public/menu
  aliases: string[]; // lowercase names the chat/voice assistant matches on
  tags?: ("spicy" | "bestseller" | "new" | "signature")[];
  verify?: boolean;
}

export type CategoryId =
  | "smash-burgers"
  | "chicken-burgers"
  | "pizzas"
  | "wings"
  | "fries"
  | "wraps"
  | "shakes"
  | "desserts"
  | "drinks";

export interface MenuCategory {
  id: CategoryId;
  label: string;
  blurb: string;
  /** Real menu-board image for the lightbox (drop-in from brand assets). */
  boardImage: string;
}

export const CATEGORIES: MenuCategory[] = [
  { id: "smash-burgers", label: "Smash Burgers", blurb: "Crispy-edged beef patties, smashed to order on the flat top.", boardImage: "/menu/boards/smash-burgers.jpg" },
  { id: "chicken-burgers", label: "Chicken Burgers", blurb: "Crunchy fried chicken with big flavour sauces.", boardImage: "/menu/boards/chicken-burgers.jpg" },
  { id: "pizzas", label: "Pizzas", blurb: "Desi-fusion crusts you will not find anywhere else.", boardImage: "/menu/boards/pizzas.jpg" },
  { id: "wings", label: "Wings", blurb: "Tossed, sauced, and dangerously moreish.", boardImage: "/menu/boards/wings.jpg" },
  { id: "fries", label: "Loaded Fries", blurb: "New York style fries, loaded or classic.", boardImage: "/menu/boards/fries.jpg" },
  { id: "wraps", label: "Wraps", blurb: "Everything good, rolled tight.", boardImage: "/menu/boards/wraps.jpg" },
  { id: "shakes", label: "Shakes", blurb: "Thick, cold, and made with real ingredients.", boardImage: "/menu/boards/shakes.jpg" },
  { id: "desserts", label: "Desserts", blurb: "Finish strong.", boardImage: "/menu/boards/desserts.jpg" },
  { id: "drinks", label: "Drinks", blurb: "Ice-cold classics.", boardImage: "/menu/boards/drinks.jpg" },
];

export const MENU: MenuItem[] = [
  // ── Smash Burgers ──────────────────────────────────────────────
  {
    id: "classic-ny-smash",
    name: "Classic New York Smash",
    category: "smash-burgers",
    description: "Double smashed beef, American cheese, shaved onion, pickles, FOUR sauce on a toasted potato bun.",
    price: 799,
    variants: [
      { id: "single", label: "Single", price: 799 },
      { id: "double", label: "Double", price: 999 },
    ],
    image: "/menu/items/classic-ny-smash.jpg",
    aliases: ["classic new york smash", "new york smash", "ny smash", "classic smash", "new york burger"],
    tags: ["bestseller", "signature"],
    verify: true,
  },
  {
    id: "texas-flamin-hot",
    name: "Texas Flamin Hot",
    category: "smash-burgers",
    description: "Smashed beef, flamin hot crust, jalapeños, melted cheese and smoked chipotle mayo.",
    price: 849,
    variants: [
      { id: "single", label: "Single", price: 849 },
      { id: "double", label: "Double", price: 1049 },
    ],
    image: "/menu/items/texas-flamin-hot.jpg",
    aliases: ["texas flamin hot", "texas flaming hot", "texas burger", "flamin hot burger", "flaming hot"],
    tags: ["spicy", "bestseller"],
    verify: true,
  },

  // ── Chicken Burgers ────────────────────────────────────────────
  {
    id: "bangkok-chipotle",
    name: "Bangkok Chipotle",
    category: "chicken-burgers",
    description: "Crispy fried chicken infused with chipotle spice, Bangkok chilli glaze, slaw and lime mayo.",
    price: 849,
    image: "/menu/items/bangkok-chipotle.jpg",
    aliases: ["bangkok chipotle", "chipotle bangkok", "bangkok burger", "chipotle burger", "bangkok chipotle burger", "chipotle bangkok burger"],
    tags: ["spicy", "signature", "bestseller"],
  },
  {
    id: "classic-crispy-chicken",
    name: "Classic Crispy Chicken",
    category: "chicken-burgers",
    description: "Buttermilk fried fillet, lettuce, pickles and garlic mayo on a toasted bun.",
    price: 749,
    image: "/menu/items/classic-crispy-chicken.jpg",
    aliases: ["classic crispy chicken", "crispy chicken burger", "chicken burger", "zinger"],
    verify: true,
  },

  // ── Pizzas ─────────────────────────────────────────────────────
  {
    id: "malai-boti-crown",
    name: "Malai Boti Crown Crust",
    category: "pizzas",
    description: "Creamy or red sauce base, malai boti chunks, crown crust stuffed with cheese.",
    price: 599,
    variants: [
      { id: "small", label: "Small", price: 599 },
      { id: "medium", label: "Medium", price: 1099 },
      { id: "large", label: "Large", price: 1499 },
    ],
    image: "/menu/items/malai-boti-crown.jpg",
    aliases: ["malai boti crown crust", "malai boti pizza", "malai boti", "crown crust"],
    tags: ["signature"],
  },
  {
    id: "seekh-kebab-crust",
    name: "Seekh Kebab Crust",
    category: "pizzas",
    description: "Signature crust ringed with seekh kebab, topped with spiced beef and onions.",
    price: 649,
    variants: [
      { id: "small", label: "Small", price: 649 },
      { id: "medium", label: "Medium", price: 1149 },
      { id: "large", label: "Large", price: 1549 },
    ],
    image: "/menu/items/seekh-kebab-crust.jpg",
    aliases: ["seekh kebab crust", "seekh kebab pizza", "kebab pizza", "seekh kabab"],
    tags: ["signature"],
    verify: true,
  },
  {
    id: "tandoori-tikka-pizza",
    name: "Tandoori Tikka",
    category: "pizzas",
    description: "Tandoori tikka chunks, red sauce, mozzarella and a charred finish.",
    price: 599,
    variants: [
      { id: "small", label: "Small", price: 599 },
      { id: "medium", label: "Medium", price: 1099 },
      { id: "large", label: "Large", price: 1499 },
    ],
    image: "/menu/items/tandoori-tikka-pizza.jpg",
    aliases: ["tandoori tikka", "tikka pizza", "tandoori pizza", "chicken tikka pizza"],
  },
  {
    id: "chipotle-chicken-pizza",
    name: "Chipotle Chicken",
    category: "pizzas",
    description: "Smoky chipotle chicken, peppers and a drizzle of chipotle ranch.",
    price: 599,
    variants: [
      { id: "small", label: "Small", price: 599 },
      { id: "medium", label: "Medium", price: 1099 },
      { id: "large", label: "Large", price: 1499 },
    ],
    image: "/menu/items/chipotle-chicken-pizza.jpg",
    aliases: ["chipotle chicken pizza", "chipotle pizza"],
    tags: ["spicy"],
  },
  {
    id: "ranchstar-pizza",
    name: "Ranchstar",
    category: "pizzas",
    description: "Grilled chicken, ranch base, mozzarella and crispy onions.",
    price: 599,
    variants: [
      { id: "small", label: "Small", price: 599 },
      { id: "medium", label: "Medium", price: 1099 },
      { id: "large", label: "Large", price: 1499 },
    ],
    image: "/menu/items/ranchstar-pizza.jpg",
    aliases: ["ranchstar", "ranch star", "ranchstar pizza", "ranch pizza"],
  },

  // ── Wings ──────────────────────────────────────────────────────
  {
    id: "cheese-wings",
    name: "Cheese Wings",
    category: "wings",
    description: "Crispy wings smothered in molten cheese sauce.",
    price: 549,
    variants: [
      { id: "6pc", label: "6 pcs", price: 549 },
      { id: "12pc", label: "12 pcs", price: 999 },
    ],
    image: "/menu/items/cheese-wings.jpg",
    aliases: ["cheese wings", "cheesy wings"],
    tags: ["bestseller"],
  },
  {
    id: "buffalo-wings",
    name: "Buffalo Wings",
    category: "wings",
    description: "Classic hot buffalo toss with ranch on the side.",
    price: 499,
    variants: [
      { id: "6pc", label: "6 pcs", price: 499 },
      { id: "12pc", label: "12 pcs", price: 899 },
    ],
    image: "/menu/items/buffalo-wings.jpg",
    aliases: ["buffalo wings", "hot wings", "spicy wings", "wings"],
    tags: ["spicy"],
    verify: true,
  },

  // ── Fries ──────────────────────────────────────────────────────
  {
    id: "new-york-fries",
    name: "New York Fries",
    category: "fries",
    description: "Skin-on fries loaded with cheese sauce, smashed beef crumble and FOUR sauce.",
    price: 549,
    variants: [
      { id: "regular", label: "Regular", price: 549 },
      { id: "large", label: "Large", price: 749 },
    ],
    image: "/menu/items/new-york-fries.jpg",
    aliases: ["new york fries", "ny fries", "loaded fries"],
    tags: ["signature", "bestseller"],
    verify: true,
  },
  {
    id: "classic-fries",
    name: "Classic Fries",
    category: "fries",
    description: "Golden, crispy, salted. The essential side.",
    price: 299,
    variants: [
      { id: "regular", label: "Regular", price: 299 },
      { id: "large", label: "Large", price: 399 },
    ],
    image: "/menu/items/classic-fries.jpg",
    aliases: ["classic fries", "fries", "french fries", "plain fries", "chips"],
    verify: true,
  },

  // ── Wraps ──────────────────────────────────────────────────────
  {
    id: "chipotle-wrap",
    name: "Chipotle Crunch Wrap",
    category: "wraps",
    description: "Crispy chicken, chipotle mayo, slaw and cheese in a toasted tortilla.",
    price: 649,
    image: "/menu/items/chipotle-wrap.jpg",
    aliases: ["chipotle crunch wrap", "chipotle wrap", "crunch wrap", "wrap", "chicken wrap"],
    verify: true,
  },

  // ── Shakes ─────────────────────────────────────────────────────
  {
    id: "lotus-shake",
    name: "Lotus Shake",
    category: "shakes",
    description: "Lotus Biscoff blended thick, crowned with crumble and drizzle.",
    price: 599,
    image: "/menu/items/lotus-shake.jpg",
    aliases: ["lotus shake", "biscoff shake", "lotus"],
    tags: ["bestseller"],
    verify: true,
  },
  {
    id: "oreo-shake",
    name: "Oreo Shake",
    category: "shakes",
    description: "Cookies and cream, properly thick.",
    price: 549,
    image: "/menu/items/oreo-shake.jpg",
    aliases: ["oreo shake", "cookies and cream shake", "oreo"],
    verify: true,
  },
  {
    id: "chocolate-shake",
    name: "Chocolate Shake",
    category: "shakes",
    description: "Belgian chocolate, whipped cream, chocolate shards.",
    price: 549,
    image: "/menu/items/chocolate-shake.jpg",
    aliases: ["chocolate shake", "choc shake"],
    verify: true,
  },

  // ── Desserts ───────────────────────────────────────────────────
  {
    id: "chocolate-lava-cookie",
    name: "Chocolate Lava Cookie",
    category: "desserts",
    description: "Warm skillet cookie with a molten chocolate centre and vanilla ice cream.",
    price: 499,
    image: "/menu/items/chocolate-lava-cookie.jpg",
    aliases: ["chocolate lava cookie", "lava cookie", "cookie", "lava cake"],
    tags: ["bestseller"],
    verify: true,
  },

  // ── Drinks ─────────────────────────────────────────────────────
  {
    id: "coke",
    name: "Coca-Cola",
    category: "drinks",
    description: "Chilled can / regular fountain.",
    price: 120,
    variants: [
      { id: "regular", label: "Regular", price: 120 },
      { id: "1.5l", label: "1.5L Bottle", price: 250 },
    ],
    image: "/menu/items/coke.jpg",
    aliases: ["coca cola", "coke", "coca-cola", "cola"],
    verify: true,
  },
  {
    id: "sprite",
    name: "Sprite",
    category: "drinks",
    description: "Chilled can / regular fountain.",
    price: 120,
    variants: [
      { id: "regular", label: "Regular", price: 120 },
      { id: "1.5l", label: "1.5L Bottle", price: 250 },
    ],
    image: "/menu/items/sprite.jpg",
    aliases: ["sprite", "lemon soda"],
    verify: true,
  },
  {
    id: "mineral-water",
    name: "Mineral Water",
    category: "drinks",
    description: "500ml bottle.",
    price: 80,
    image: "/menu/items/mineral-water.jpg",
    aliases: ["mineral water", "water", "pani"],
    verify: true,
  },
];

export const DELIVERY_FEE = 149;
export const FREE_DELIVERY_ABOVE = 2500;

export function formatPKR(n: number): string {
  return `Rs. ${n.toLocaleString("en-PK")}`;
}

export function findItem(id: string): MenuItem | undefined {
  return MENU.find((m) => m.id === id);
}
