"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { sparkFrom } from "@/lib/spark";
import type { MenuItemView } from "./ItemModal";

/**
 * The quick-add rules, shared by the menu page and the homepage bestsellers:
 * simple items (one price, no choices) add straight to the cart with a 1.3s
 * "added" flash; anything with sizes or add-ons opens the full picker instead.
 *
 * `origin` is the button that was pressed, so the spark can burst from it. It
 * comes through as an element rather than a click's coordinates so a keyboard
 * activation lands in the right place too.
 */
export function useQuickAdd() {
  const [added, setAdded] = useState<string | null>(null);
  const [selected, setSelected] = useState<MenuItemView | null>(null);

  const quickAdd = async (item: MenuItemView, origin?: Element | null) => {
    if (!item.available) return;
    if (item.variants.length > 0 || item.modifierGroups.length > 0) {
      setSelected(item);
      return;
    }
    setAdded(item.id);
    // Fires on the add path only — an item with choices opens the picker
    // instead, and sparking there would promise something that has not happened.
    sparkFrom(origin);
    await api("/api/cart/lines", { method: "POST", body: JSON.stringify({ itemId: item.id, qty: 1 }) }).catch(() => {
      setAdded((cur) => (cur === item.id ? null : cur));
      toast.error("Couldn't add that — try again.");
    });
    setTimeout(() => setAdded((cur) => (cur === item.id ? null : cur)), 1300);
  };

  return { added, quickAdd, selected, setSelected };
}
