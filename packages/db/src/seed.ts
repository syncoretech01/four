/**
 * Idempotent seed: upserts the official FOUR menu (categories, items,
 * variants, modifier groups) from @four/shared. Safe to run repeatedly;
 * never deletes orders or carts.
 */
import { BRANCHES, MENU_CATEGORIES, MENU_ITEMS, MODIFIER_GROUPS } from "@four/shared";
import { prisma } from "./index.js";

/** Demo riders per branch; PINs are placeholders until real staff onboarding. */
const DEMO_RIDERS = [
  { name: "Bilal", phone: "03000000001", pin: "1234", branchId: "fairways-dha6" },
  { name: "Danish", phone: "03000000002", pin: "1234", branchId: "fairways-dha6" },
  { name: "Shahzaib", phone: "03000000003", pin: "1234", branchId: "allama-iqbal-town" },
  { name: "Faizan", phone: "03000000004", pin: "1234", branchId: "lake-city" },
];

async function main(): Promise<void> {
  for (const b of BRANCHES) {
    await prisma.branch.upsert({
      where: { id: b.id },
      create: { id: b.id, name: b.name, shortName: b.shortName, address: b.address, lat: b.lat, lng: b.lng, areaIds: b.areaIds },
      update: { name: b.name, shortName: b.shortName, address: b.address, lat: b.lat, lng: b.lng, areaIds: b.areaIds },
    });
  }
  for (const r of DEMO_RIDERS) {
    await prisma.rider.upsert({
      where: { phone: r.phone },
      create: r,
      update: { name: r.name, branchId: r.branchId },
    });
  }
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
  const branches = await prisma.branch.count();
  const riders = await prisma.rider.count();
  console.log(
    `Seeded ${MENU_CATEGORIES.length} categories, ${items} items, ${variants} variants, ${branches} branches, ${riders} riders.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
