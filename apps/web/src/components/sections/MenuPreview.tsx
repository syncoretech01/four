"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MENU_CATEGORIES } from "@four/shared";
import { api } from "@/lib/api";
import { ItemModal, type MenuItemView } from "../menu/ItemModal";
import { BestsellerShowcase } from "../menu/BestsellerShowcase";
import type { MenuCategoryView } from "../menu/types";

/**
 * Home-page teaser for the ordering flow: the bestseller portfolio plus
 * category links, all funnelling into /menu. Tapping a dish opens the full
 * item picker right here, so an order can start without leaving the page.
 * The category chips come from @four/shared so they render even while the
 * live menu is still loading (or the API is down).
 */
export function MenuPreview() {
  const [categories, setCategories] = useState<MenuCategoryView[]>([]);
  const [selected, setSelected] = useState<MenuItemView | null>(null);
  const [loading, setLoading] = useState(true);

  const [offline, setOffline] = useState(false);

  useEffect(() => {
    api<{ categories: MenuCategoryView[] }>("/api/menu")
      .then((d) => {
        setCategories(d.categories);
        setOffline(d.categories.length === 0);
      })
      .catch(() => setOffline(true))
      .finally(() => setLoading(false));
  }, []);

  const bestsellers = useMemo(
    () => categories.flatMap((c) => c.items.filter((i) => i.available && i.tags.includes("bestseller"))).slice(0, 8),
    [categories],
  );
  const categoryLabels = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.label])), [categories]);

  return (
    <section id="menu" className="band scroll-mt-20">
      <div className="wrap">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="f-eyebrow">Order in</p>
            <h2 className="f-heading f-heading--lg sm:text-6xl">The Greatest Hits</h2>
            <p className="f-lede">The dishes Lahore reorders. Tap one to start an order, or browse the whole board.</p>
          </div>
          <Link href="/menu" className="f-btn f-btn--primary f-btn--md">
            Browse the full menu
          </Link>
        </div>

        {loading ? (
          <div className="mt-6 flex gap-6 overflow-hidden" aria-busy="true" aria-label="Loading the best sellers">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-96 w-72 shrink-0 animate-pulse rounded-card border-2 border-ink-900/25 bg-paper-200" />
            ))}
          </div>
        ) : offline ? (
          <p className="f-badge f-badge--sunken mt-8 w-fit justify-start !text-sm !normal-case !tracking-normal">
            The kitchen board is offline — the category links below still work.
          </p>
        ) : (
          bestsellers.length > 0 && (
            <div className="mt-2">
              <BestsellerShowcase items={bestsellers} onSelect={setSelected} categoryLabels={categoryLabels} />
            </div>
          )
        )}

        <div className="f-rail mt-6">
          {MENU_CATEGORIES.map((c) => (
            <Link key={c.id} href={`/menu#cat-${c.id}`} className="f-chip f-chip--sm shrink-0">
              {c.label}
            </Link>
          ))}
          <Link href="/menu" className="f-chip f-chip--sm shrink-0 is-on">
            Everything →
          </Link>
        </div>
      </div>

      <ItemModal item={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
