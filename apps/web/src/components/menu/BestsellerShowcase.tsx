"use client";

import { ItemCard } from "./ItemCard";
import type { MenuItemView } from "./ItemModal";

/**
 * The bestsellers as one row of dish cards: a horizontal snap rail below
 * 640px (`.f-cards-rail`), a 2/3-column grid above. One container, never
 * both, so screen readers hear a single list and every photo loads once.
 * Each card reveals itself (ItemCard owns the motion wrapper).
 */
export function BestsellerShowcase({
  items,
  onSelect,
  onQuickAdd = onSelect,
  addedId = null,
}: {
  items: MenuItemView[];
  onSelect: (item: MenuItemView) => void;
  /** Quick-add handler; defaults to opening the picker. */
  onQuickAdd?: (item: MenuItemView) => void;
  /** Id of the item whose "Added" flash is showing, if any. */
  addedId?: string | null;
}) {
  return (
    <div role="list" aria-label="Best sellers" className="f-cards-rail sm:grid sm:grid-cols-2 sm:gap-[var(--grid-gap)] xl:grid-cols-3">
      {items.map((item, i) => (
        <div key={item.id} role="listitem" className="w-[min(76vw,19rem)] shrink-0 snap-center sm:w-auto">
          <ItemCard item={item} index={i} added={addedId === item.id} onOpen={onSelect} onQuickAdd={onQuickAdd} />
        </div>
      ))}
    </div>
  );
}
