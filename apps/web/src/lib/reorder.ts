"use client";

/**
 * "Order it again": rebuild an order's lines in the cart at today's menu and
 * today's prices, via the same cart endpoints the menu uses. Items that have
 * left the menu (or gone unavailable) are skipped and reported honestly.
 *
 * Variants resolve by exact label; modifiers were stored as display strings
 * generated deterministically by the API ("Label" / "Label x2"), so they
 * parse back to option labels. Anything unresolvable is dropped from that
 * line rather than guessed.
 */
import type { OrderView } from "@four/shared";
import type { MenuItemView } from "@/components/menu/ItemModal";
import type { MenuCategoryView } from "@/components/menu/types";
import { api } from "./api";
import { toast } from "./toast";
import { useStore } from "./store";

function parseModifier(display: string): { label: string; qty: number } {
  const m = /^(.*?)(?: x(\d+))?$/.exec(display);
  return { label: m?.[1] ?? display, qty: m?.[2] ? Number(m[2]) : 1 };
}

export async function reorder(order: OrderView): Promise<void> {
  let items: Map<string, MenuItemView>;
  try {
    const { categories } = await api<{ categories: MenuCategoryView[] }>("/api/menu");
    items = new Map(categories.flatMap((c) => c.items).map((i) => [i.id, i]));
  } catch {
    toast.error("Couldn't load the menu — check your connection and try again.");
    return;
  }

  let added = 0;
  const total = order.lines.length;

  for (const line of order.lines) {
    const item = line.itemId ? items.get(line.itemId) : undefined;
    if (!item?.available) continue;

    const variant = line.variantLabel ? item.variants.find((v) => v.label === line.variantLabel) : undefined;
    if (line.variantLabel && !variant) continue; // that size is gone; skip, don't guess

    const modifiers: { groupId: string; optionId: string; qty: number }[] = [];
    for (const display of line.modifiers) {
      const { label, qty } = parseModifier(display);
      for (const g of item.modifierGroups) {
        const opt = g.options.find((o) => o.label === label);
        if (opt) {
          modifiers.push({ groupId: g.id, optionId: opt.slug, qty });
          break;
        }
      }
    }

    try {
      await api("/api/cart/lines", {
        method: "POST",
        body: JSON.stringify({ itemId: item.id, variantId: variant?.slug, qty: line.qty, modifiers }),
      });
      added++;
    } catch {
      /* counted as skipped below */
    }
  }

  if (added === 0) {
    toast.error("Those items aren't on the menu right now.");
    return;
  }
  if (added === total) toast.success(`Added ${added} item${added === 1 ? "" : "s"} — prices are today's.`);
  else toast.info(`Added ${added} of ${total} — some items are off the menu today.`);
  useStore.getState().setCartOpen(true);
}
