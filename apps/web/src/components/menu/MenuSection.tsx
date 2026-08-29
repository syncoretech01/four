"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { formatPKR } from "@four/shared";
import { api } from "@/lib/api";
import { SmartImage } from "../SmartImage";
import { ItemModal, type MenuItemView } from "./ItemModal";
import { BoardLightbox } from "./BoardLightbox";

export interface MenuCategoryView {
  id: string;
  label: string;
  blurb: string;
  boardImage: string;
  items: MenuItemView[];
}

/**
 * The interactive menu: category rail with an animated pill, item cards
 * with the real food photography, a full item modal (sizes, meal deals,
 * add-ons), and a lightbox showing the real printed menu.
 */
export function MenuSection() {
  const [categories, setCategories] = useState<MenuCategoryView[]>([]);
  const [active, setActive] = useState<string>("smash-burgers");
  const [selected, setSelected] = useState<MenuItemView | null>(null);
  const [boardOpen, setBoardOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const reduce = useReducedMotion();

  useEffect(() => {
    api<{ categories: MenuCategoryView[] }>("/api/menu")
      .then((d) => setCategories(d.categories))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const category = useMemo(() => categories.find((c) => c.id === active) ?? categories[0], [categories, active]);

  return (
    <section id="menu" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h2 className="font-display text-4xl font-semibold text-ink sm:text-5xl">The Menu</h2>
          <p className="mt-3 max-w-[48ch] text-ink-soft">{category?.blurb ?? "Everything, made loud and fresh."}</p>
        </div>
        <button
          onClick={() => setBoardOpen(true)}
          className="rounded-full border-2 border-red px-6 py-3 text-sm font-semibold text-red transition hover:bg-red hover:text-cream active:scale-[0.98]"
        >
          View the real menu
        </button>
      </div>

      <div className="mt-8 flex gap-2 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActive(c.id)}
            className={`relative shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition active:scale-[0.97] ${
              c.id === category?.id ? "text-cream" : "text-ink hover:bg-beige-deep"
            }`}
          >
            {c.id === category?.id && (
              <motion.span
                layoutId="cat-pill"
                className="absolute inset-0 rounded-full bg-red"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative">{c.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-card bg-beige-deep/60" />
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={category?.id ?? "none"}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {category?.items.map((item, i) => (
              <motion.button
                key={item.id}
                onClick={() => item.available && setSelected(item)}
                initial={reduce ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.5, delay: Math.min(i * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
                whileHover={reduce || !item.available ? undefined : { y: -6 }}
                className={`group relative overflow-hidden rounded-card bg-cream text-left shadow-sm shadow-ink/5 transition-shadow ${
                  item.available ? "hover:shadow-xl hover:shadow-ink/10" : "opacity-60"
                }`}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <SmartImage
                    src={item.image ?? `/menu-items/${item.id}.jpg`}
                    alt={item.name}
                    fallbackLabel={item.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  {item.tags.includes("bestseller") && (
                    <span className="absolute left-4 top-4 rounded-full bg-red px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-cream">
                      Bestseller
                    </span>
                  )}
                  {!item.available && (
                    <span className="absolute inset-0 flex items-center justify-center bg-ink/40 font-display text-xl font-semibold text-cream">
                      Sold out today
                    </span>
                  )}
                </div>
                <div className="flex items-start justify-between gap-3 p-5">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-ink">{item.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{item.description}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-sm font-bold text-red">{formatPKR(item.basePrice)}</span>
                    {item.variants.length > 0 && <span className="block text-[11px] text-ink-soft">from</span>}
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      <ItemModal item={selected} onClose={() => setSelected(null)} />
      {category && <BoardLightbox open={boardOpen} category={category} onClose={() => setBoardOpen(false)} />}
    </section>
  );
}
