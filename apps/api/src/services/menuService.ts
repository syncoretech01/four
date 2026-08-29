import { prisma } from "@four/db";

export interface MenuItemView {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  basePrice: number;
  image: string | null;
  available: boolean;
  tags: string[];
  variants: { id: string; slug: string; label: string; price: number }[];
  modifierGroups: {
    id: string;
    label: string;
    maxSelections: number;
    options: { id: string; slug: string; label: string; price: unknown }[];
  }[];
}

const itemInclude = {
  variants: { orderBy: { sortOrder: "asc" as const } },
  modifierGroups: { include: { group: { include: { options: true } } } },
};

function toView(item: {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  basePrice: number;
  image: string | null;
  available: boolean;
  tags: string[];
  variants: { id: string; slug: string; label: string; price: number }[];
  modifierGroups: {
    group: { id: string; label: string; maxSelections: number; options: { id: string; slug: string; label: string; price: unknown }[] };
  }[];
}): MenuItemView {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    categoryId: item.categoryId,
    basePrice: item.basePrice,
    image: item.image,
    available: item.available,
    tags: item.tags,
    variants: item.variants.map((v) => ({ id: v.id, slug: v.slug, label: v.label, price: v.price })),
    modifierGroups: item.modifierGroups.map((g) => ({
      id: g.group.id,
      label: g.group.label,
      maxSelections: g.group.maxSelections,
      options: g.group.options,
    })),
  };
}

export async function fullMenu() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { items: { orderBy: { sortOrder: "asc" }, include: itemInclude } },
  });
  return categories.map((c) => ({
    id: c.id,
    label: c.label,
    blurb: c.blurb,
    boardImage: c.boardImage,
    items: c.items.map(toView),
  }));
}

export async function getItem(itemId: string): Promise<MenuItemView | null> {
  const item = await prisma.menuItem.findUnique({ where: { id: itemId }, include: itemInclude });
  return item ? toView(item) : null;
}

/**
 * Alias-aware search: exact alias phrase beats name substring beats
 * token overlap. Used by both bots and the REST search endpoint.
 */
export async function searchItems(q: string, limit = 6): Promise<MenuItemView[]> {
  const query = q.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  if (!query) return [];
  const items = await prisma.menuItem.findMany({ where: { available: true }, include: itemInclude });
  const tokens = query.split(" ");

  const scored = items
    .map((item) => {
      let score = 0;
      const name = item.name.toLowerCase();
      for (const alias of item.aliases) {
        if (alias === query) score = Math.max(score, 100);
        else if (query.includes(alias)) score = Math.max(score, 60 + alias.length);
        else if (alias.includes(query)) score = Math.max(score, 50 + query.length);
      }
      if (name.includes(query)) score = Math.max(score, 55);
      const overlap = tokens.filter((t) => t.length > 2 && (name.includes(t) || item.aliases.some((a) => a.includes(t)))).length;
      score = Math.max(score, overlap * 10);
      return { item, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((s) => toView(s.item));
}
