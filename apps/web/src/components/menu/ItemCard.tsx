"use client";

import { AnimatePresence, motion } from "motion/react";
import { useReduceMotion } from "@/lib/useAnim";
import { formatPKR } from "@four/shared";
import { SmartImage } from "../SmartImage";
import { TagStack } from "./tags";
import type { MenuItemView } from "./ItemModal";

/**
 * One dish in an ordering grid. Card chrome comes from the design system's
 * `.f-item` block. The reveal animation lives on an outer wrapper on
 * purpose: motion writes `transform` inline, which would otherwise beat the
 * CSS `:hover` lift.
 */
export function ItemCard({
  item,
  index = 0,
  added,
  onOpen,
  onQuickAdd,
}: {
  item: MenuItemView;
  /** Position in its grid, for the staggered reveal. */
  index?: number;
  /** True while the "added to cart" check is flashing on this card. */
  added: boolean;
  onOpen: (item: MenuItemView) => void;
  onQuickAdd: (item: MenuItemView) => void;
}) {
  const reduce = useReduceMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
    >
      <article className={`f-item h-full ${item.available ? "" : "is-unavailable"}`}>
        <button
          onClick={() => item.available && onOpen(item)}
          className="block w-full text-left"
          aria-label={`${item.name}, ${formatPKR(item.basePrice)}${item.variants.length ? " and up" : ""} - see details`}
        >
          <div className="f-item__media">
            <SmartImage src={item.image ?? `/menu-items/${item.id}.jpg`} alt={item.name} fallbackLabel={item.name} className="h-full w-full" />
            <div className="f-item__scrim" />
            <TagStack tags={item.tags} className="absolute left-3.5 top-3.5" />
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
            onClick={() => onQuickAdd(item)}
            aria-label={
              item.variants.length || item.modifierGroups.length ? `Choose options for ${item.name}` : `Add ${item.name} to cart`
            }
            className="f-item__add f-iconbtn f-iconbtn--md f-iconbtn--accent"
          >
            <AnimatePresence mode="wait" initial={false}>
              {added ? (
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
  );
}
