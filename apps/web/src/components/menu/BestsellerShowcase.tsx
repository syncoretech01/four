"use client";

import { motion } from "motion/react";
import { useReduceMotion } from "@/lib/useAnim";
import { formatPKR } from "@four/shared";
import { SmartImage } from "../SmartImage";
import type { MenuItemView } from "./ItemModal";

/**
 * The bestsellers, hung like an artist's portfolio: each dish is a numbered
 * work in a tilted frame with a gallery placard underneath. Horizontal rail
 * with scroll snap; tapping a work opens the full item picker.
 *
 * The tilt is CSS on `.f-work` (see globals.css) and the reveal animates
 * this outer wrapper, so motion's inline transform never flattens the hang.
 */
export function BestsellerShowcase({
  items,
  onSelect,
  categoryLabels,
}: {
  items: MenuItemView[];
  onSelect: (item: MenuItemView) => void;
  /** categoryId -> display label, for the placard's second line. */
  categoryLabels?: Record<string, string>;
}) {
  const reduce = useReduceMotion();

  return (
    <div className="f-gallery" role="list" aria-label="Best sellers">
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          role="listitem"
          className="w-[min(76vw,19rem)] shrink-0 snap-center"
          initial={reduce ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, delay: Math.min(i * 0.06, 0.3), ease: [0.16, 1, 0.3, 1] }}
        >
          <button
            type="button"
            onClick={() => onSelect(item)}
            className="f-work"
            aria-label={`${item.name}, ${formatPKR(item.basePrice)}${item.variants.length ? " and up" : ""} - view and order`}
          >
            <div className="f-work__frame">
              <SmartImage src={item.image ?? `/menu-items/${item.id}.jpg`} alt={item.name} fallbackLabel={item.name} className="h-full w-full" />
              <span className="f-work__no f-badge">No. {String(i + 1).padStart(2, "0")}</span>
            </div>
            <div className="f-work__plate">
              <div>
                <span className="f-work__title">{item.name}</span>
                <span className="f-work__meta">
                  {item.tags.includes("signature") ? "Signature · " : item.tags.includes("spicy") ? "Spicy · " : ""}
                  {categoryLabels?.[item.categoryId] ?? "Fan favourite"}
                </span>
              </div>
              <span className="f-work__price">
                {formatPKR(item.basePrice)}
                {item.variants.length > 0 && <span className="f-work__from">from</span>}
              </span>
            </div>
          </button>
        </motion.div>
      ))}
    </div>
  );
}
