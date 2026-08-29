/**
 * Idempotent seed: upserts the official FOUR menu (categories, items,
 * variants, modifier groups) from @four/shared. Safe to run repeatedly;
 * never deletes orders or carts.
 */
import { MENU_CATEGORIES, MENU_ITEMS, MODIFIER_GROUPS } from "@four/shared";
import { prisma } from "./index.js";

async function main(): Promise<void> {
  for (const [i, group] of MODIFIER_GROUPS.entries()) {
    await prisma.modifierGroup.upsert({
      where: { id: group.id },
      create: { id: group.id, label: group.label, maxSelections: group.maxSelections },
      update: { label: group.label, maxSelections: group.maxSelections },
    });
    for (const opt of group.options) {
      const price = typeof opt.price === "number" ? { flat: opt.price } : { bySize: opt.price };
      await prisma.modifierOption.upsert({
        where: { id: `${group.id}:${opt.id}` },
        create: { id: `${group.id}:${opt.id}`, slug: opt.id, label: opt.label, price, groupId: group.id },
        update: { label: opt.label, price },
      });
    }
    void i;
  }

  for (const [i, cat] of MENU_CATEGORIES.entries()) {
    await prisma.category.upsert({
      where: { id: cat.id },
      create: { id: cat.id, label: cat.label, blurb: cat.blurb, boardImage: cat.boardImage, sortOrder: i },
      update: { label: cat.label, blurb: cat.blurb, boardImage: cat.boardImage, sortOrder: i },
    });
  }

  for (const [i, item] of MENU_ITEMS.entries()) {
    const data = {
      name: item.name,
      description: item.description,
      categoryId: item.category,
      basePrice: item.price,
      image: item.image ?? `/menu-items/${item.id}.jpg`,
      tags: item.tags ?? [],
      aliases: item.aliases,
      sortOrder: i,
    };
    await prisma.menuItem.upsert({
      where: { id: item.id },
      create: { id: item.id, ...data },
      update: data,
    });

    for (const [vi, v] of (item.variants ?? []).entries()) {
      await prisma.variant.upsert({
        where: { id: `${item.id}:${v.id}` },
        create: { id: `${item.id}:${v.id}`, slug: v.id, label: v.label, price: v.price, sortOrder: vi, itemId: item.id },
        update: { label: v.label, price: v.price, sortOrder: vi },
      });
    }

    for (const groupId of item.modifierGroups ?? []) {
      await prisma.itemModifierGroup.upsert({
        where: { itemId_groupId: { itemId: item.id, groupId } },
        create: { itemId: item.id, groupId },
        update: {},
      });
    }
  }

  const items = await prisma.menuItem.count();
  const variants = await prisma.variant.count();
  console.log(`Seeded ${MENU_CATEGORIES.length} categories, ${items} items, ${variants} variants.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
