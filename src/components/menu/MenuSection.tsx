"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CATEGORIES, MENU, formatPKR, type CategoryId, type MenuItem } from "@/data/menu";
import { SmartImage } from "../SmartImage";
import { ItemModal } from "./ItemModal";
import { MenuBoardLightbox } from "./MenuBoardLightbox";

/**
 * Interactive menu: category rail, animated item grid, tap an item for a
 * full card with real photography + variants, or open the real printed
 * menu board for the category in a lightbox.
 */
export function MenuSection() {
  const [active, setActive] = useState<CategoryId>("smash-burgers");
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const [boardOpen, setBoardOpen] = useState(false);
  const reduce = useReducedMotion();

  const category = CATEGORIES.find((c) => c.id === active)!;
  const items = useMemo(() => MENU.filter((m) => m.category === active), [active]);

  return (
    <section id="menu" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h2 className="font-display text-4xl text-ink sm:text-5xl">THE MENU</h2>
          <p className="mt-3 max-w-[48ch] text-ink-soft">{category.blurb}</p>
        </div>
        <button
          onClick={() => setBoardOpen(true)}
          className="rounded-full border-2 border-red px-6 py-3 text-sm font-semibold text-red transition hover:bg-red hover:text-cream active:scale-[0.98]"
        >
          View the real menu
        </button>
      </div>

      {/* category rail */}
      <div className="mt-8 flex gap-2 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setActive(c.id)}
            className={`relative shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition active:scale-[0.97] ${
              c.id === active ? "text-cream" : "text-ink hover:bg-beige-deep"
            }`}
          >
            {c.id === active && (
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

      {/* item grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((item, i) => (
            <motion.button
              key={item.id}
              onClick={() => setSelected(item)}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              whileHover={reduce ? undefined : { y: -6 }}
              className="group relative overflow-hidden rounded-card bg-cream text-left shadow-sm shadow-ink/5 transition-shadow hover:shadow-xl hover:shadow-ink/10"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <SmartImage
                  src={item.image}
                  alt={item.name}
                  fallbackLabel={item.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                {item.tags?.includes("bestseller") && (
                  <span className="absolute left-4 top-4 rounded-full bg-red px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-cream">
                    Bestseller
                  </span>
                )}
              </div>
              <div className="flex items-start justify-between gap-3 p-5">
                <div>
                  <h3 className="font-display text-xl text-ink">{item.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{item.description}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-sm font-bold text-red">{formatPKR(item.price)}</span>
                  {item.variants && <span className="block text-[11px] text-ink-soft">from</span>}
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </AnimatePresence>

      <ItemModal item={selected} onClose={() => setSelected(null)} />
      <MenuBoardLightbox open={boardOpen} category={category} onClose={() => setBoardOpen(false)} />
    </section>
  );
}
