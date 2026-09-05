import { MENU_CATEGORIES, MENU_ITEMS, MODIFIER_GROUPS } from "@four/shared";
import type { MenuCategoryView } from "@/components/menu/types";
import type { MenuItemView } from "@/components/menu/ItemModal";

/**
 * The full menu, derived from @four/shared at build time in exactly the shape
 * GET /api/menu returns.
 *
 * The ordering page used to render nothing until a client-side fetch resolved,
 * which meant the menu was invisible to a crawler, invisible for the first paint
 * on a slow connection, and gone entirely whenever the API hiccuped. It also
 * made check-ssr-visible's `"Classic New York"` assertion pass on a technicality:
 * the string was present only inside the page's JSON-LD blob, never in anything
 * a customer could see.
 *
 * @four/shared is the same file the database is seeded from, so this is not a
 * second source of truth — it is the same source, read directly. The API fetch
 * still runs and still wins: it carries live availability and any price the
 * kitchen has changed since the last deploy. This is the floor, not the answer.
 *
 * The id/slug construction mirrors packages/db/src/seed.ts exactly
 * (`${item.id}:${variant.id}`), so a line built from these ids is accepted by
 * the cart API unchanged.
 */
function itemView(item: (typeof MENU_ITEMS)[number]): MenuItemView {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    categoryId: item.category,
    basePrice: item.price,
    image: item.image ?? `/menu-items/${item.id}.jpg`,
    // Optimistic: the kitchen marks items out of stock at run time, and the API
    // response corrects this within a moment of hydration. Rendering everything
    // as unavailable until then would be a worse lie than rendering it available.
    available: true,
    tags: item.tags ?? [],
    variants: (item.variants ?? []).map((v) => ({
      id: `${item.id}:${v.id}`,
      slug: v.id,
      label: v.label,
      price: v.price,
    })),
    modifierGroups: (item.modifierGroups ?? []).flatMap((groupId) => {
      const group = MODIFIER_GROUPS.find((g) => g.id === groupId);
      if (!group) return [];
      return [{
        id: group.id,
        label: group.label,
        maxSelections: group.maxSelections,
        options: group.options.map((o) => ({
          id: `${group.id}:${o.id}`,
          slug: o.id,
          label: o.label,
          price: typeof o.price === "number" ? { flat: o.price } : { bySize: o.price },
        })),
      }];
    }),
  };
}

export const STATIC_MENU: MenuCategoryView[] = MENU_CATEGORIES.map((c) => ({
  id: c.id,
  label: c.label,
  blurb: c.blurb,
  boardImage: c.boardImage,
  items: MENU_ITEMS.filter((i) => i.category === c.id).map(itemView),
}));

/** Bestsellers for the homepage teaser, in menu order. */
export const STATIC_BESTSELLERS: MenuItemView[] = STATIC_MENU
  .flatMap((c) => c.items)
  .filter((i) => i.tags.includes("bestseller"));
