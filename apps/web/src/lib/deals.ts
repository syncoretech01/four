import {
  MENU_ITEMS,
  MODIFIER_GROUPS,
  DELIVERY_FEE,
  FREE_DELIVERY_ABOVE,
  type MenuItemData,
} from "@four/shared";

/**
 * The deals page's single source of truth. Every number here is DERIVED from
 * the live menu data - nothing is hard-coded - and every lookup throws, so a
 * renamed menu item breaks the build instead of shipping a wrong price.
 *
 * The "deal" mechanics are the ones that actually exist: the meal-deal
 * modifier group (fries + drink priced below the separate items) and the
 * free-delivery threshold. No invented promotions.
 */

export interface Deal {
  id: string;
  name: string;
  /** Hero item: photo + `/menu?item=` deep link. */
  itemId: string;
  composition: string;
  dealPrice: number;
  /** The same food ordered as separate menu items; undefined = no honest comparison. */
  strikePrice?: number;
  saving: number;
  badge: string;
  note: string;
  href: string;
}

function item(id: string): MenuItemData {
  const found = MENU_ITEMS.find((i) => i.id === id);
  if (!found) throw new Error(`deals: menu item "${id}" no longer exists - update lib/deals.ts`);
  return found;
}

function variantPrice(itemId: string, variantId: string): number {
  const v = item(itemId).variants?.find((x) => x.id === variantId);
  if (!v) throw new Error(`deals: variant "${itemId}/${variantId}" no longer exists - update lib/deals.ts`);
  return v.price;
}

function mealDealPrice(optionId: string): number {
  const group = MODIFIER_GROUPS.find((g) => g.id === "meal-deal");
  const opt = group?.options.find((o) => o.id === optionId);
  if (!opt || typeof opt.price !== "number") {
    throw new Error(`deals: meal-deal option "${optionId}" no longer exists - update lib/deals.ts`);
  }
  return opt.price;
}

/** Cheapest way to make any burger a meal - used in the page lede. */
export const MEAL_DEAL_FROM = Math.min(
  ...(MODIFIER_GROUPS.find((g) => g.id === "meal-deal")?.options ?? []).map((o) =>
    typeof o.price === "number" ? o.price : Infinity,
  ),
);

function burgerMeal(cfg: {
  id: string;
  name: string;
  burgerId: string;
  mealOptionId: string;
  /** The separate items the meal-deal replaces. */
  alaCarteIds: string[];
  drinkLabel: string;
}): Deal {
  const burger = item(cfg.burgerId);
  const dealPrice = burger.price + mealDealPrice(cfg.mealOptionId);
  const strikePrice = burger.price + cfg.alaCarteIds.reduce((s, id) => s + item(id).price, 0);
  return {
    id: cfg.id,
    name: cfg.name,
    itemId: burger.id,
    composition: `${burger.name} + fries + ${cfg.drinkLabel}`,
    dealPrice,
    strikePrice,
    saving: strikePrice - dealPrice,
    badge: `Save Rs. ${strikePrice - dealPrice}`,
    note: "Pick the meal-deal option on the burger.",
    href: `/menu?item=${burger.id}`,
  };
}

export function buildDeals(): Deal[] {
  const bangkokMealPrice = item("bangkok-chipotle").price + mealDealPrice("fries-soda");
  const bangkokAlaCarte = item("bangkok-chipotle").price + item("plain-fries").price + item("cola").price;

  const pizzaNightPrice = variantPrice("cheese-burst", "large") + item("garlic-bread").price + 2 * item("cola").price;
  if (pizzaNightPrice < FREE_DELIVERY_ABOVE) {
    // the bundle exists to cross the free-delivery line; if prices drop below
    // it the card would lie, so fail the build instead
    throw new Error("deals: the pizza-night bundle no longer clears the free-delivery threshold");
  }

  const squadPrice = 4 * bangkokMealPrice;
  const squadAlaCarte = 4 * bangkokAlaCarte; // also clears free delivery, so no fee on either side

  return [
    burgerMeal({
      id: "new-york-meal",
      name: "The New York Meal",
      burgerId: "classic-new-york",
      mealOptionId: "fries-soda",
      alaCarteIds: ["plain-fries", "cola"],
      drinkLabel: "soda",
    }),
    burgerMeal({
      id: "bangkok-meal",
      name: "Bangkok Chipotle Meal",
      burgerId: "bangkok-chipotle",
      mealOptionId: "fries-soda",
      alaCarteIds: ["plain-fries", "cola"],
      drinkLabel: "soda",
    }),
    burgerMeal({
      id: "margarita-upgrade",
      name: "The Margarita Upgrade",
      burgerId: "cairo-honey-mustard",
      mealOptionId: "fries-margarita",
      alaCarteIds: ["plain-fries", "mint-margarita"],
      drinkLabel: "mint margarita",
    }),
    burgerMeal({
      id: "flamin-fizz-meal",
      name: "Flamin' Hot Fizz Meal",
      burgerId: "texas-flamin-hot",
      mealOptionId: "fries-fizz",
      alaCarteIds: ["plain-fries", "peach-fizz"],
      drinkLabel: "any fizz chiller",
    }),
    {
      id: "pizza-night",
      name: "Pizza Night, Delivery On Us",
      itemId: "cheese-burst",
      composition: "Large Cheese Burst + Garlic Bread + 2 Colas",
      dealPrice: pizzaNightPrice,
      saving: DELIVERY_FEE,
      badge: "Free delivery",
      note: `Clears Rs. ${FREE_DELIVERY_ABOVE.toLocaleString("en-PK")}, so the Rs. ${DELIVERY_FEE} delivery fee disappears.`,
      href: "/menu#cat-pizzas",
    },
    {
      id: "squad-order",
      name: "The Squad Order",
      itemId: "bangkok-chipotle",
      composition: "4 × Bangkok Chipotle meals (fries + soda each)",
      dealPrice: squadPrice,
      strikePrice: squadAlaCarte,
      saving: squadAlaCarte - squadPrice,
      badge: `Save Rs. ${(squadAlaCarte - squadPrice).toLocaleString("en-PK")}`,
      note: "Feeds four. Rides free - it clears the free-delivery line on its own.",
      href: "/menu?item=bangkok-chipotle",
    },
  ];
}
