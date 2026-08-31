"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useReduceMotion } from "@/lib/useAnim";
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
 * The interactive menu: category rail, sticker item cards with the real food
 * photography, a full item modal (sizes, meal deals, add-ons), and a lightbox
 * showing the real printed menu.
 *
 * Card chrome comes from the design system's `.f-item` block. The reveal
 * animation lives on an outer wrapper on purpose: motion writes `transform`
 * inline, which would otherwise beat the CSS `:hover` lift.
 */
export function MenuSection() {
  const [categories, setCategories] = useState<MenuCategoryView[]>([]);
  const [active, setActive] = useState<string>("smash-burgers");
  const [selected, setSelected] = useState<MenuItemView | null>(null);
  const [boardOpen, setBoardOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState<string | null>(null);
  const reduce = useReduceMotion();

  useEffect(() => {
    api<{ categories: MenuCategoryView[] }>("/api/menu")
      .then((d) => setCategories(d.categories))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const category = useMemo(() => categories.find((c) => c.id === active) ?? categories[0], [categories, active]);

  // simple items (one price, no choices) add straight to the cart; anything
  // with sizes or add-ons opens the full picker instead
  const quickAdd = async (item: MenuItemView) => {
    if (!item.available) return;
    if (item.variants.length > 0 || item.modifierGroups.length > 0) {
      setSelected(item);
      return;
    }
    setAdded(item.id);
    await api("/api/cart/lines", { method: "POST", body: JSON.stringify({ itemId: item.id, qty: 1 }) }).catch(() => {});
    setTimeout(() => setAdded((cur) => (cur === item.id ? null : cur)), 1300);
  };

  return (
    <section id="menu" className="wrap band scroll-mt-20">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="f-eyebrow">Order in</p>
          <h2 className="f-heading f-heading--lg sm:text-6xl">The Menu</h2>
          <p className="f-lede">{category?.blurb ?? "Everything, made loud and fresh."}</p>
        </div>
        <button onClick={() => setBoardOpen(true)} className="f-btn f-btn--outline-red f-btn--md">
          View the real menu
        </button>
      </div>

      <div className="f-rail mt-8">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActive(c.id)}
            className={`f-rail__item ${c.id === category?.id ? "is-active" : ""}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-card border-2 border-ink-900/25 bg-paper-200" />
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
              <motion.div
                key={item.id}
                initial={reduce ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.5, delay: Math.min(i * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
              >
                <article className={`f-item h-full ${item.available ? "" : "is-unavailable"}`}>
                  <button
                    onClick={() => item.available && setSelected(item)}
                    className="block w-full text-left"
                    aria-label={`${item.name}, ${formatPKR(item.basePrice)}${item.variants.length ? " and up" : ""} - see details`}
                  >
                    <div className="f-item__media">
                      <SmartImage src={item.image ?? `/menu-items/${item.id}.jpg`} alt={item.name} fallbackLabel={item.name} className="h-full w-full" />
                      <div className="f-item__scrim" />
                      {item.tags.includes("bestseller") && (
                        <span className="f-item__flag f-badge f-badge--accent">Bestseller</span>
                      )}
                      {!item.available && <span className="f-item__soldout">Sold out today</span>}
                    </div>
                    <div className="f-item__body">
                      <div>
                        <h3 className="f-item__name">{item.name}</h3>
                        <p className="f-item__desc">{item.description}</p>
                      </div>
                      <div className="f-item__price">
                        {formatPKR(item.basePrice)}
                        {item.variants.length > 0 && <span className="f-item__from">from</span>}
                      </div>
                    </div>
                  </button>

                  {item.available && (
                    <button
                      onClick={() => quickAdd(item)}
                      aria-label={
                        item.variants.length || item.modifierGroups.length ? `Choose options for ${item.name}` : `Add ${item.name} to cart`
                      }
                      className="f-item__add f-iconbtn f-iconbtn--md f-iconbtn--accent"
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        {added === item.id ? (
                          <motion.svg
                            key="check"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            initial={reduce ? false : { scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                          >
                            <path d="M4 12.5l5 5L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                          </motion.svg>
                        ) : (
                          <motion.span
                            key="plus"
                            initial={reduce ? false : { scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            className="text-2xl font-extrabold leading-none"
                          >
                            +
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  )}
                </article>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      <ItemModal item={selected} onClose={() => setSelected(null)} />
      {category && <BoardLightbox open={boardOpen} category={category} onClose={() => setBoardOpen(false)} />}
    </section>
  );
}
