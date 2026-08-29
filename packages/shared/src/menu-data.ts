/**
 * The official FOUR menu, transcribed from the printed menu sheets in
 * brand-assets/menu (MAIN MENU, PIZZA MENU, DESSERT MENU). All prices in
 * PKR, exclusive of tax, as printed. This file is the single source of
 * truth: the database is seeded from it and the assistant matches
 * against its aliases.
 */

export interface MenuVariantData {
  id: string;
  label: string;
  price: number;
}

export interface MenuItemData {
  id: string;
  name: string;
  category: string;
  description: string;
  /** Base price; for variant items this is the cheapest variant. */
  price: number;
  variants?: MenuVariantData[];
  modifierGroups?: string[];
  /** Lowercase phrases the chat/voice assistant matches. */
  aliases: string[];
  tags?: ("bestseller" | "spicy" | "signature" | "new")[];
  image?: string;
}

export interface MenuCategoryData {
  id: string;
  label: string;
  blurb: string;
  boardImage: string;
}

export interface ModifierOptionData {
  id: string;
  label: string;
  /** Flat price, or per-variant price keyed by variant id. */
  price: number | Record<string, number>;
}

export interface ModifierGroupData {
  id: string;
  label: string;
  maxSelections: number;
  options: ModifierOptionData[];
}

export const MODIFIER_GROUPS: ModifierGroupData[] = [
  {
    id: "meal-deal",
    label: "Make it a meal",
    maxSelections: 1,
    options: [
      { id: "fries-soda", label: "Fries + Soda", price: 249 },
      { id: "fries-margarita", label: "Fries + Mint Margarita", price: 399 },
      { id: "fries-fizz", label: "Fries + Fizz Drink", price: 499 },
    ],
  },
  {
    id: "add-ons",
    label: "Add-ons",
    maxSelections: 6,
    options: [
      { id: "beef-patty", label: "Beef Patty 110g", price: 399 },
      { id: "crispy-fillet", label: "Crispy Chicken Fillet", price: 349 },
      { id: "grilled-fillet", label: "Grilled Fillet", price: 249 },
      { id: "crumbed-fillet", label: "Crumbed Fillet", price: 349 },
      { id: "cheese-slice", label: "Cheese Slice", price: 99 },
      { id: "extra-dip", label: "Extra Dip Sauce", price: 99 },
    ],
  },
  {
    id: "pizza-toppings",
    label: "Extra Toppings",
    maxSelections: 5,
    options: [
      { id: "extra-topping", label: "Extra Topping", price: { small: 99, medium: 149, large: 249 } },
    ],
  },
];

export const MENU_CATEGORIES: MenuCategoryData[] = [
  { id: "smash-burgers", label: "Smash Burgers", blurb: "110g beef patties, smashed to order with crispy lace edges.", boardImage: "/menu-boards/main-menu.jpg" },
  { id: "chicken-burgers", label: "Chicken Burgers", blurb: "Crunchy fried fillets with big city flavours.", boardImage: "/menu-boards/main-menu.jpg" },
  { id: "wings", label: "Wings", blurb: "Six pieces, tossed the way you like them.", boardImage: "/menu-boards/main-menu.jpg" },
  { id: "wraps", label: "Wraps", blurb: "Everything good, rolled tight and toasted.", boardImage: "/menu-boards/main-menu.jpg" },
  { id: "fries", label: "Fries", blurb: "From plain and masala to fully loaded.", boardImage: "/menu-boards/main-menu.jpg" },
  { id: "pizzas", label: "Pizzas", blurb: "Hand-stretched, from cheese burst to seekh kebab crust.", boardImage: "/menu-boards/pizza-menu.jpg" },
  { id: "calzones", label: "Calzones & Sides", blurb: "Folded, stuffed and baked golden.", boardImage: "/menu-boards/pizza-menu.jpg" },
  { id: "drinks", label: "Drinks", blurb: "Sodas, lemonades and coolers.", boardImage: "/menu-boards/pizza-menu.jpg" },
  { id: "fizz-chillers", label: "Fizz Chillers", blurb: "Frozen fizz in five flavours.", boardImage: "/menu-boards/pizza-menu.jpg" },
  { id: "shakes", label: "Shakes", blurb: "Thick ones. Proper ones.", boardImage: "/menu-boards/pizza-menu.jpg" },
  { id: "desserts", label: "Desserts", blurb: "Cheesecakes and molten cookies.", boardImage: "/menu-boards/dessert-menu.jpg" },
];

const PIZZA_SIZES = (s: number | null, m: number, l: number): MenuVariantData[] => [
  ...(s ? [{ id: "small", label: "Small", price: s }] : []),
  { id: "medium", label: "Medium", price: m },
  { id: "large", label: "Large", price: l },
];

export const MENU_ITEMS: MenuItemData[] = [
  // ── Beef Smash Burgers (110g) ─────────────────────────────
  {
    id: "classic-new-york",
    name: "Classic New York",
    category: "smash-burgers",
    description: "Double-smashed 110g beef, American cheese, shaved onion, pickles and FOUR sauce.",
    price: 999,
    modifierGroups: ["meal-deal", "add-ons"],
    aliases: ["classic new york", "new york smash", "ny smash", "classic newyork", "new york burger", "classic smash"],
    tags: ["signature", "bestseller"],
  },
  {
    id: "london-bbq",
    name: "London BBQ",
    category: "smash-burgers",
    description: "Smashed beef with smoky BBQ glaze, crispy onions and cheddar.",
    price: 949,
    modifierGroups: ["meal-deal", "add-ons"],
    aliases: ["london bbq", "london burger", "bbq burger", "london barbecue"],
  },
  {
    id: "texas-flamin-hot",
    name: "Texas Flamin Hot",
    category: "smash-burgers",
    description: "Smashed beef, flamin hot crust, jalapeños and chipotle mayo.",
    price: 949,
    modifierGroups: ["meal-deal", "add-ons"],
    aliases: ["texas flamin hot", "texas flaming hot", "texas burger", "flamin hot", "flaming hot burger"],
    tags: ["spicy", "bestseller"],
  },
  {
    id: "paris-truffle",
    name: "Paris Truffle",
    category: "smash-burgers",
    description: "Smashed beef with truffle mayo, swiss cheese and caramelised onion.",
    price: 949,
    modifierGroups: ["meal-deal", "add-ons"],
    aliases: ["paris truffle", "truffle burger", "paris burger"],
    tags: ["signature"],
  },

  // ── Chicken Burgers ───────────────────────────────────────
  {
    id: "bangkok-chipotle",
    name: "Bangkok Chipotle",
    category: "chicken-burgers",
    description: "Crispy fried chicken with Bangkok chilli glaze, chipotle spice, slaw and lime mayo.",
    price: 849,
    modifierGroups: ["meal-deal", "add-ons"],
    aliases: ["bangkok chipotle", "chipotle bangkok", "bangkok burger", "chipotle burger", "bangkok chipotle burger", "chipotle bangkok burger"],
    tags: ["spicy", "signature", "bestseller"],
  },
  {
    id: "cairo-honey-mustard",
    name: "Cairo Honey Mustard",
    category: "chicken-burgers",
    description: "Crispy fillet with sweet honey mustard, lettuce and pickles.",
    price: 849,
    modifierGroups: ["meal-deal", "add-ons"],
    aliases: ["cairo honey mustard", "honey mustard burger", "cairo burger", "honey mustard"],
  },
  {
    id: "cheesy-mexico",
    name: "Cheesy Mexico",
    category: "chicken-burgers",
    description: "Crispy fillet buried in molten cheese sauce with jalapeños.",
    price: 949,
    modifierGroups: ["meal-deal", "add-ons"],
    aliases: ["cheesy mexico", "mexico burger", "cheesy mexican", "mexican burger"],
    tags: ["bestseller"],
  },
  {
    id: "vegas-parm",
    name: "Vegas Parm",
    category: "chicken-burgers",
    description: "Crispy fillet with parmesan cream, marinara and toasted crumb.",
    price: 849,
    modifierGroups: ["meal-deal", "add-ons"],
    aliases: ["vegas parm", "vegas burger", "parm burger", "parmesan burger"],
  },
  {
    id: "cairo-chipotle",
    name: "Cairo Chipotle",
    category: "chicken-burgers",
    description: "Crispy fillet with smoky chipotle mayo and crunchy slaw.",
    price: 849,
    modifierGroups: ["meal-deal", "add-ons"],
    aliases: ["cairo chipotle", "cairo chipotle burger"],
    tags: ["spicy"],
  },

  // ── Wings (6 pcs) ─────────────────────────────────────────
  {
    id: "plain-wings",
    name: "Plain Wings",
    category: "wings",
    description: "Six crispy fried wings, seasoned and served with dip.",
    price: 399,
    aliases: ["plain wings", "fried wings", "wings"],
  },
  {
    id: "masala-wings",
    name: "Masala Wings",
    category: "wings",
    description: "Six wings dusted in desi masala.",
    price: 449,
    aliases: ["masala wings", "desi wings"],
    tags: ["spicy"],
  },
  {
    id: "bbq-wings",
    name: "BBQ Wings",
    category: "wings",
    description: "Six wings tossed in smoky BBQ sauce.",
    price: 549,
    aliases: ["bbq wings", "barbecue wings"],
  },
  {
    id: "cheese-wings",
    name: "Cheese Wings",
    category: "wings",
    description: "Six wings smothered in molten cheese sauce.",
    price: 549,
    aliases: ["cheese wings", "cheesy wings"],
    tags: ["bestseller"],
  },

  // ── Wraps ─────────────────────────────────────────────────
  {
    id: "bangkok-chipotle-wrap",
    name: "Bangkok Chipotle Wrap",
    category: "wraps",
    description: "Crispy chicken, Bangkok chilli glaze, slaw and lime mayo in a toasted tortilla.",
    price: 1200,
    modifierGroups: ["add-ons"],
    aliases: ["bangkok chipotle wrap", "bangkok wrap", "chipotle wrap", "chicken wrap", "wrap"],
    tags: ["spicy"],
  },
  {
    id: "texas-bbq-wrap",
    name: "Texas BBQ Wrap",
    category: "wraps",
    description: "Smashed beef, BBQ glaze, crispy onions and cheese, rolled tight.",
    price: 1250,
    modifierGroups: ["add-ons"],
    aliases: ["texas bbq wrap", "bbq wrap", "texas wrap", "beef wrap"],
  },

  // ── Fries ─────────────────────────────────────────────────
  {
    id: "plain-fries",
    name: "Plain Fries",
    category: "fries",
    description: "Golden, crispy, salted.",
    price: 349,
    aliases: ["plain fries", "fries", "french fries", "chips"],
  },
  {
    id: "masala-fries",
    name: "Masala Fries",
    category: "fries",
    description: "Crispy fries with a desi masala hit.",
    price: 349,
    aliases: ["masala fries", "spicy fries"],
    tags: ["spicy"],
  },
  {
    id: "new-york-fries",
    name: "New York Fries",
    category: "fries",
    description: "Loaded with cheese sauce, smashed beef crumble and FOUR sauce.",
    price: 799,
    aliases: ["new york fries", "ny fries", "loaded fries"],
    tags: ["signature", "bestseller"],
  },
  {
    id: "bangkok-fries",
    name: "Bangkok Fries",
    category: "fries",
    description: "Loaded fries with Bangkok chilli glaze and crispy chicken.",
    price: 799,
    aliases: ["bangkok fries"],
    tags: ["spicy"],
  },
  {
    id: "disco-fries",
    name: "Disco Fries",
    category: "fries",
    description: "Cheese-sauced fries with gravy and crispy bits.",
    price: 799,
    aliases: ["disco fries"],
  },
  {
    id: "lahori-fries",
    name: "Lahori Fries",
    category: "fries",
    description: "Loaded fries the Lahori way: chatpata, saucy, unapologetic.",
    price: 799,
    aliases: ["lahori fries", "lahore fries"],
    tags: ["signature"],
  },

  // ── Pizzas ────────────────────────────────────────────────
  {
    id: "cheese-burst",
    name: "Cheese Burst",
    category: "pizzas",
    description: "Molten cheese sealed inside the crust. Handle with care.",
    price: 1299,
    variants: PIZZA_SIZES(null, 1299, 1699),
    modifierGroups: ["pizza-toppings"],
    aliases: ["cheese burst", "cheese burst pizza"],
    tags: ["bestseller"],
  },
  {
    id: "tandoori-tikka",
    name: "Tandoori Tikka",
    category: "pizzas",
    description: "Tandoori tikka chunks, red sauce and mozzarella with a charred finish.",
    price: 599,
    variants: PIZZA_SIZES(599, 1299, 1699),
    modifierGroups: ["pizza-toppings"],
    aliases: ["tandoori tikka", "tikka pizza", "tandoori pizza", "chicken tikka pizza"],
  },
  {
    id: "malai-boti-crown-creamy",
    name: "Malai Boti Crown Crust (Creamy)",
    category: "pizzas",
    description: "Creamy base, malai boti chunks, cheese-stuffed crown crust.",
    price: 1349,
    variants: PIZZA_SIZES(null, 1349, 1749),
    modifierGroups: ["pizza-toppings"],
    aliases: ["malai boti crown crust creamy", "malai boti creamy", "malai boti crown", "malai boti pizza", "malai boti", "crown crust"],
    tags: ["signature", "bestseller"],
  },
  {
    id: "malai-boti-crown-red",
    name: "Malai Boti Crown Crust (Red Sauce)",
    category: "pizzas",
    description: "Red sauce base, malai boti chunks, cheese-stuffed crown crust.",
    price: 1349,
    variants: PIZZA_SIZES(null, 1349, 1749),
    modifierGroups: ["pizza-toppings"],
    aliases: ["malai boti crown crust red", "malai boti red sauce", "malai boti red"],
    tags: ["signature"],
  },
  {
    id: "bbq-peperoni",
    name: "BBQ Peperoni",
    category: "pizzas",
    description: "Smoky BBQ base with beef peperoni and mozzarella.",
    price: 599,
    variants: PIZZA_SIZES(599, 1299, 1699),
    modifierGroups: ["pizza-toppings"],
    aliases: ["bbq peperoni", "bbq pepperoni", "peperoni pizza", "pepperoni pizza", "pepperoni"],
  },
  {
    id: "peri-peri-fajita",
    name: "Peri Peri Fajita",
    category: "pizzas",
    description: "Peri peri chicken, peppers and onions on a red base.",
    price: 599,
    variants: PIZZA_SIZES(599, 1299, 1699),
    modifierGroups: ["pizza-toppings"],
    aliases: ["peri peri fajita", "fajita pizza", "peri peri pizza", "peri peri"],
    tags: ["spicy"],
  },
  {
    id: "cheesy-cheese",
    name: "Cheesy Cheese",
    category: "pizzas",
    description: "For purists: layers of mozzarella and cheddar, nothing else.",
    price: 599,
    variants: PIZZA_SIZES(599, 1299, 1699),
    modifierGroups: ["pizza-toppings"],
    aliases: ["cheesy cheese", "cheese pizza", "plain pizza", "margherita"],
  },
  {
    id: "chipotle-chicken-pizza",
    name: "Chipotle Chicken",
    category: "pizzas",
    description: "Smoky chipotle chicken with peppers and chipotle ranch drizzle.",
    price: 599,
    variants: PIZZA_SIZES(599, 1299, 1699),
    modifierGroups: ["pizza-toppings"],
    aliases: ["chipotle chicken pizza", "chipotle pizza"],
    tags: ["spicy"],
  },
  {
    id: "ranchstar",
    name: "Ranchstar",
    category: "pizzas",
    description: "Grilled chicken on a ranch base with mozzarella and crispy onions.",
    price: 599,
    variants: PIZZA_SIZES(599, 1299, 1699),
    modifierGroups: ["pizza-toppings"],
    aliases: ["ranchstar", "ranch star", "ranchstar pizza", "ranch pizza"],
  },
  {
    id: "seekh-kebab-crust",
    name: "Seekh Kebab Crust",
    category: "pizzas",
    description: "Signature crust ringed with seekh kebab, topped with spiced beef.",
    price: 1299,
    variants: PIZZA_SIZES(null, 1299, 1699),
    modifierGroups: ["pizza-toppings"],
    aliases: ["seekh kebab crust", "seekh kebab pizza", "kebab pizza", "seekh kabab"],
    tags: ["signature"],
  },

  // ── Calzones & Sides ──────────────────────────────────────
  {
    id: "malai-boti-calzone",
    name: "Malai Boti Calzone",
    category: "calzones",
    description: "Folded and stuffed with malai boti and cheese, baked golden.",
    price: 1050,
    aliases: ["malai boti calzone", "calzone"],
  },
  {
    id: "garlic-bread",
    name: "Garlic Bread",
    category: "calzones",
    description: "Buttery garlic bread, baked to order.",
    price: 449,
    aliases: ["garlic bread"],
  },

  // ── Drinks ────────────────────────────────────────────────
  { id: "cola", name: "Cola", category: "drinks", description: "Chilled.", price: 179, aliases: ["cola", "coke", "coca cola", "pepsi", "soda", "soft drink"] },
  { id: "white-soda", name: "White Soda", category: "drinks", description: "Chilled.", price: 179, aliases: ["white soda", "sprite", "7up", "seven up"] },
  { id: "cola-zero", name: "Cola Zero", category: "drinks", description: "All the taste, zero sugar.", price: 179, aliases: ["cola zero", "coke zero", "zero cola", "diet coke"] },
  { id: "white-soda-zero", name: "White Soda Zero", category: "drinks", description: "Zero sugar.", price: 179, aliases: ["white soda zero", "sprite zero", "7up free"] },
  { id: "orange-soda", name: "Orange Soda", category: "drinks", description: "Chilled.", price: 179, aliases: ["orange soda", "fanta", "mirinda"] },
  { id: "mint-margarita", name: "Mint Margarita", category: "drinks", description: "Fresh mint, lime and fizz.", price: 449, aliases: ["mint margarita", "mint margrita", "margarita"] },
  { id: "fresh-lemonade", name: "Fresh Lemonade", category: "drinks", description: "Squeezed to order.", price: 229, aliases: ["fresh lemonade", "lemonade", "lemon"] },
  { id: "iced-milo", name: "Iced Milo", category: "drinks", description: "The viral one, over ice.", price: 499, aliases: ["iced milo", "milo"] },

  // ── Fizz Chillers ─────────────────────────────────────────
  { id: "peach-fizz", name: "Peach Fizz", category: "fizz-chillers", description: "Frozen peach fizz.", price: 449, aliases: ["peach fizz", "peach"] },
  { id: "passion-fizz", name: "Passion Fizz", category: "fizz-chillers", description: "Frozen passion fruit fizz.", price: 449, aliases: ["passion fizz", "passion fruit"] },
  { id: "mango-fizz", name: "Mango Fizz", category: "fizz-chillers", description: "Frozen mango fizz.", price: 449, aliases: ["mango fizz", "mango"] },
  { id: "lychee-fizz", name: "Lychee Fizz", category: "fizz-chillers", description: "Frozen lychee fizz.", price: 449, aliases: ["lychee fizz", "lychee"] },
  { id: "raspberry-lemonade-frozen", name: "Raspberry Lemonade Frozen", category: "fizz-chillers", description: "Frozen raspberry lemonade.", price: 449, aliases: ["raspberry lemonade", "raspberry fizz", "frozen lemonade"] },

  // ── Shakes ────────────────────────────────────────────────
  { id: "lotus-shake", name: "Lotus Shake", category: "shakes", description: "Lotus Biscoff blended thick with crumble on top.", price: 699, aliases: ["lotus shake", "biscoff shake", "lotus"], tags: ["bestseller"] },
  { id: "matilda-shake", name: "Matilda Shake", category: "shakes", description: "Chocolate-cake shake, Matilda style.", price: 699, aliases: ["matilda shake", "matilda", "chocolate cake shake"] },
  { id: "toffee-shake", name: "Toffee Shake", category: "shakes", description: "Buttery toffee, blended thick.", price: 649, aliases: ["toffee shake", "toffee", "caramel shake"] },
  { id: "snickers-shake", name: "Snickers Shake", category: "shakes", description: "Snickers, peanuts and chocolate.", price: 649, aliases: ["snickers shake", "snickers"] },
  { id: "strawberry-banana-shake", name: "Strawberry Banana Shake", category: "shakes", description: "Fresh strawberry and banana.", price: 649, aliases: ["strawberry banana shake", "strawberry shake", "banana shake"] },

  // ── Desserts ──────────────────────────────────────────────
  {
    id: "lotus-cheesecake",
    name: "Lotus Cheese Cake",
    category: "desserts",
    description: "Cream cheese filling layered with lotus ganache, topped with cookie crumble.",
    price: 449,
    aliases: ["lotus cheesecake", "lotus cheese cake", "biscoff cheesecake"],
    tags: ["bestseller"],
  },
  {
    id: "brownie-cheesecake",
    name: "Brownie Cheesecake",
    category: "desserts",
    description: "Cream cheese on a cookie crumble base, layered with chocolate ganache and Alaska brownie.",
    price: 449,
    aliases: ["brownie cheesecake", "brownie"],
  },
  {
    id: "berry-cheesecake",
    name: "Berry Cheesecake",
    category: "desserts",
    description: "Cream cheese filling layered with berry puree, topped with cookie crumble.",
    price: 499,
    aliases: ["berry cheesecake", "berry cheese cake"],
  },
  {
    id: "chocolate-lava-cookie",
    name: "Chocolate Lava Cookie",
    category: "desserts",
    description: "Warm lava cookie topped with ice cream, drizzled with lotus ganache.",
    price: 599,
    aliases: ["chocolate lava cookie", "lava cookie", "cookie"],
    tags: ["bestseller"],
  },
  {
    id: "double-chocolate-lava-cookie",
    name: "Double Chocolate Lava Cookie",
    category: "desserts",
    description: "Double chocolate lava cookie with ice cream and lotus ganache.",
    price: 649,
    aliases: ["double chocolate lava cookie", "double lava cookie", "double cookie"],
  },
];
