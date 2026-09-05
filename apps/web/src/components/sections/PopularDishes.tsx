"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { ItemModal } from "../menu/ItemModal";
import { ItemCard } from "../menu/ItemCard";
import { useQuickAdd } from "../menu/useQuickAdd";
import type { MenuCategoryView } from "../menu/types";
import { STATIC_MENU } from "@/lib/staticMenu";
import { SectionHeader } from "../ds/SectionHeader";
import { PillCta } from "../ds/PillCta";
import { DoodleBackdrop } from "../ds/DoodleBackdrop";

/**
 * Dinevo's "popular dishes" band on red: the live bestsellers as cream dish
 * cards, each ordering straight from the homepage through the same quick-add
 * rules as /menu (simple items add, anything with choices opens the picker).
 * Keeps id="menu" so the location modal's "scroll to #menu" still lands.
 */
export function PopularDishes() {
  // Seeded from @four/shared so the homepage's only ordering surface exists in
  // the server HTML. It used to start empty and collapse to a one-line notice
  // whenever the API hiccuped, taking ~900px of layout and the add-to-cart
  // affordance with it. The fetch still corrects live availability.
  const [categories, setCategories] = useState<MenuCategoryView[]>(STATIC_MENU);
  const { added, quickAdd, selected, setSelected } = useQuickAdd();

  useEffect(() => {
    api<{ categories: MenuCategoryView[] }>("/api/menu")
      .then((d) => {
        if (d.categories.length > 0) setCategories(d.categories);
      })
      .catch(() => {
        /* keep the static menu: it is the same data the database is seeded from */
      });
  }, []);

  // the header already says "Best sellers", so that tag is dropped from the cards
  const bestsellers = useMemo(
    () =>
      categories
        .flatMap((c) => c.items.filter((i) => i.available && i.tags.includes("bestseller")))
        .slice(0, 6)
        .map((i) => ({ ...i, tags: i.tags.filter((t) => t !== "bestseller") })),
    [categories],
  );

  return (
    <>
    <section id="menu" className="on-red band relative isolate">
      <DoodleBackdrop />
      <div className="wrap relative z-[1]">
        <SectionHeader
          align="center"
          title="The hits Lahore keeps reordering"
          highlight="reordering"
          tag="Best sellers"
          tag2="Order now"
          lede="Tap a dish to build it right here — sizes, meal deals and add-ons included."
        />

        <div className="mt-12">
          <div className="grid gap-[var(--grid-gap)] sm:grid-cols-2 lg:grid-cols-3">
            {bestsellers.map((item, i) => (
              <ItemCard key={item.id} item={item} index={i} added={added === item.id} onOpen={setSelected} onQuickAdd={quickAdd} />
            ))}
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <PillCta href="/menu">Explore menu</PillCta>
        </div>
      </div>
    </section>
    {/* outside the isolated band so the fixed z-50 picker sits above the z-40 chrome */}
    <ItemModal item={selected} onClose={() => setSelected(null)} />
    </>
  );
}
