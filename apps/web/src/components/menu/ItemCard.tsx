"use client";

import { AnimatePresence, motion } from "motion/react";
import { useReduceMotion } from "@/lib/useAnim";
import { formatPKR } from "@four/shared";
import { SmartImage } from "../SmartImage";
import { PriceTag } from "../ds/PriceTag";
import { TagStack } from "./tags";
import type { MenuItemView } from "./ItemModal";

/**
 * One dish in an ordering grid: the cream `.f-item` card (white inside cream
 * sections) with a 4:3 photo, straight sticker tags, name + description, and
 * a foot row holding the quick-add pill and the red price square. The reveal
 * animation lives on an outer wrapper on purpose: motion writes `transform`
 * inline, which would otherwise beat the CSS `:hover` photo zoom.
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
  /** True while the "added to cart" flash is showing on this card. */
  added: boolean;
  onOpen: (item: MenuItemView) => void;
  onQuickAdd: (item: MenuItemView) => void;
}) {
  const reduce = useReduceMotion();
  const hasChoices = item.variants.length > 0 || item.modifierGroups.length > 0;

  return (
    <motion.div
      className="h-full"
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
    >
      <article className={`f-item h-full ${item.available ? "" : "is-unavailable"}`}>
        <button
          onClick={() => item.available && onOpen(item)}
          className="block w-full grow text-left"
          aria-label={`${item.name}, ${formatPKR(item.basePrice)}${item.variants.length ? " and up" : ""} - see details`}
        >
          <div className="f-item__media">
            <SmartImage src={item.image ?? `/menu-items/${item.id}.jpg`} alt={item.name} fallbackLabel={item.name} className="h-full w-full" />
            <TagStack tags={item.tags} className="absolute left-5 top-5" />
            {!item.available && <span className="f-item__soldout">Sold out today</span>}
          </div>
          <div className="f-item__body">
            <h3 className="f-item__name">{item.name}</h3>
            <p className="f-item__desc">{item.description}</p>
          </div>
        </button>

        <div className="f-item__foot">
          {item.available && (
            <button
              onClick={() => onQuickAdd(item)}
              aria-label={hasChoices ? `Choose options for ${item.name}` : `Add ${item.name} to cart`}
              className="f-btn f-btn--secondary f-btn--sm f-item__add"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={added ? "added" : "idle"}
                  initial={reduce ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                >
                  {added ? "Added ✓" : hasChoices ? "Options" : "Add"}
                </motion.span>
              </AnimatePresence>
            </button>
          )}
          <PriceTag price={item.basePrice} from={item.variants.length > 0} className={item.available ? "" : "ml-auto"} />
        </div>
      </article>
    </motion.div>
  );
}
