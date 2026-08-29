/**
 * Deterministic, keyless ordering assistant for FOUR.
 *
 * Adapted from the bestbuy fallback-bot pattern: ordered intents over a
 * span-consuming alias matcher, so "I want to order a chipotle bangkok
 * burger with large fries and coke" resolves each dish (longest alias
 * wins, matched spans are consumed so "chipotle" is not counted twice),
 * picks up quantities ("two", "2x") and sizes ("large", "small") near
 * each match, and returns structured cart actions plus a reply.
 *
 * Runs identically in the browser (chat + voice) and in the /api/chat
 * route; an LLM (ANTHROPIC_API_KEY) can be layered on server-side and
 * fall back to this when absent.
 */

import { MENU, CATEGORIES, formatPKR, findItem, type MenuItem } from "@/data/menu";

export type AssistantAction =
  | { type: "add"; itemId: string; variantId?: string; qty: number }
  | { type: "remove"; itemId: string }
  | { type: "clear" }
  | { type: "open-cart" }
  | { type: "checkout" }
  | { type: "open-location" }
  | { type: "show-menu"; categoryId?: string };

export interface AssistantResult {
  reply: string;
  actions: AssistantAction[];
}

export interface CartView {
  lines: { itemId: string; variantId?: string; qty: number; label: string; lineTotal: number }[];
  total: number;
}

const QTY_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, ek: 1, two: 2, do: 2, three: 3, teen: 3, four: 4, char: 4,
  five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, couple: 2,
};

const SIZE_WORDS: Record<string, string[]> = {
  // spoken word -> variant ids it can map to (first existing wins)
  small: ["small", "regular", "single", "6pc"],
  regular: ["regular", "small", "single", "6pc"],
  medium: ["medium", "regular"],
  large: ["large", "double", "12pc", "1.5l"],
  big: ["large", "double", "12pc"],
  single: ["single", "regular"],
  double: ["double", "large"],
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

interface AliasMatch {
  item: MenuItem;
  alias: string;
  start: number;
  end: number;
}

/** Find non-overlapping alias matches, longest aliases first. */
function matchItems(text: string): AliasMatch[] {
  const padded = ` ${text} `;
  const candidates: AliasMatch[] = [];
  const aliases = MENU.flatMap((item) => item.aliases.map((alias) => ({ item, alias }))).sort(
    (a, b) => b.alias.length - a.alias.length,
  );
  const consumed: [number, number][] = [];
  const overlaps = (s: number, e: number) => consumed.some(([cs, ce]) => s < ce && e > cs);

  for (const { item, alias } of aliases) {
    let from = 0;
    while (true) {
      const idx = padded.indexOf(` ${alias} `, from);
      if (idx === -1) break;
      const start = idx;
      const end = idx + alias.length + 2;
      if (!overlaps(start, end) && !candidates.some((c) => c.item.id === item.id && c.start === start)) {
        candidates.push({ item, alias, start, end });
        consumed.push([start, end]);
      }
      from = idx + 1;
    }
  }
  return candidates.sort((a, b) => a.start - b.start);
}

/**
 * Read quantity + size words in the ~4 tokens before an alias match,
 * never looking past the end of the previous match so "large fries and
 * coke" sizes the fries, not the coke.
 */
function readModifiers(text: string, match: AliasMatch, item: MenuItem, floor: number): { qty: number; variantId?: string } {
  const before = text.slice(Math.max(floor, match.start - 28), match.start);
  const tokens = normalize(before).split(" ").slice(-4);

  let qty = 1;
  let variantId: string | undefined;
  for (const tok of tokens) {
    if (/^\d{1,2}$/.test(tok)) qty = Math.min(20, Math.max(1, Number(tok)));
    else if (QTY_WORDS[tok] !== undefined) qty = QTY_WORDS[tok];
    if (SIZE_WORDS[tok] && item.variants) {
      variantId = SIZE_WORDS[tok].find((v) => item.variants!.some((iv) => iv.id === v));
    }
  }
  // "fries large" ordering too (match.end is in padded space: one past the trailing space)
  const after = normalize(text.slice(match.end - 1, match.end + 11)).split(" ")[0] ?? "";
  if (!variantId && SIZE_WORDS[after] && item.variants) {
    variantId = SIZE_WORDS[after].find((v) => item.variants!.some((iv) => iv.id === v));
  }
  if (!variantId && item.variants?.length) variantId = item.variants[0].id;
  return { qty, variantId };
}

function priceOf(item: MenuItem, variantId?: string): number {
  return item.variants?.find((v) => v.id === variantId)?.price ?? item.price;
}

function labelOf(item: MenuItem, variantId?: string): string {
  const v = item.variants?.find((x) => x.id === variantId);
  return v ? `${item.name} (${v.label})` : item.name;
}

export function assistantReply(raw: string, cart: CartView): AssistantResult {
  const text = normalize(raw);

  // ── clear cart ──
  if (/\b(clear|empty|khali)\b/.test(text) && /\b(cart|basket|order)\b/.test(text)) {
    return { reply: "Done, your cart is empty. What are you craving?", actions: [{ type: "clear" }] };
  }

  // ── view cart ──
  if (/\b(cart|basket)\b/.test(text) && !/\b(add|remove|order|want|clear|empty)\b/.test(text)) {
    if (cart.lines.length === 0) {
      return { reply: "Your cart is empty right now. Try: \"I want a Bangkok Chipotle with large fries and a coke\".", actions: [] };
    }
    const lines = cart.lines.map((l) => `${l.qty}x ${l.label}`).join(", ");
    return {
      reply: `You have ${lines}. Total ${formatPKR(cart.total)}. Say "checkout" when you are ready.`,
      actions: [{ type: "open-cart" }],
    };
  }

  // ── remove item ──
  const removeMatch = text.match(/\b(?:remove|take out|hatao|nikaal(?:o)?|minus)\b(.*)/);
  if (removeMatch && removeMatch[1].trim()) {
    const matches = matchItems(normalize(removeMatch[1]));
    if (matches.length > 0) {
      return {
        reply: `Removed ${matches.map((m) => m.item.name).join(" and ")} from your cart.`,
        actions: matches.map((m) => ({ type: "remove" as const, itemId: m.item.id })),
      };
    }
    return { reply: "I could not find that in your cart. Say \"what's in my cart\" to review it.", actions: [] };
  }

  // ── checkout ──
  if (/\b(checkout|check out|place (?:my |the )?order|confirm order|order (?:kar|kr) ?do)\b/.test(text)) {
    if (cart.lines.length === 0) {
      return { reply: "Your cart is empty, let's fix that first. What would you like to eat?", actions: [] };
    }
    return {
      reply: `Great, your total is ${formatPKR(cart.total)}. I have opened checkout, just fill in your details and hit Place order.`,
      actions: [{ type: "checkout" }],
    };
  }

  // ── delivery / location ──
  if (/\b(deliver|delivery|area|location|address|kahan|kidhar)\b/.test(text) && !/\b(order|want|add)\b/.test(text)) {
    return {
      reply: "We deliver across Lahore: DHA, Gulberg, Model Town, Johar Town, Allama Iqbal Town and more. Pick your area and block here.",
      actions: [{ type: "open-location" }],
    };
  }

  // ── price inquiry (before add, so "how much is the lotus shake" doesn't add it) ──
  if (/\b(?:how much|price|kitne|kitna)\b/.test(text)) {
    const m = matchItems(text)[0];
    if (m) {
      const variants = m.item.variants?.map((v) => `${v.label} ${formatPKR(v.price)}`).join(", ");
      return { reply: variants ? `${m.item.name}: ${variants}.` : `${m.item.name} is ${formatPKR(m.item.price)}.`, actions: [] };
    }
  }

  // ── add / order (also bare "chipotle bangkok burger" with no verb) ──
  const wantsToOrder = /\b(order|add|want|get|give|need|le lo|chahiye|mangwa|bhej)\b/.test(text);
  const matches = matchItems(text);
  if (matches.length > 0 && (wantsToOrder || matches.length >= 1)) {
    const actions: AssistantAction[] = [];
    const added: string[] = [];
    let addedTotal = 0;
    let prevEnd = 0;
    for (const m of matches.slice(0, 6)) {
      const { qty, variantId } = readModifiers(text, m, m.item, prevEnd);
      prevEnd = m.end;
      actions.push({ type: "add", itemId: m.item.id, variantId, qty });
      added.push(`${qty > 1 ? `${qty}x ` : ""}${labelOf(m.item, variantId)}`);
      addedTotal += priceOf(m.item, variantId) * qty;
    }
    const newTotal = cart.total + addedTotal;
    return {
      reply: `Added ${added.join(", ")} to your cart. Total is now ${formatPKR(newTotal)}. Anything else, or shall I take you to checkout?`,
      actions,
    };
  }

  // ── menu inquiry ──
  if (/\b(menu|what do you have|kya hai|options|show me|recommend|suggest|best ?seller|famous)\b/.test(text)) {
    const cat = CATEGORIES.find((c) => text.includes(c.label.toLowerCase().split(" ")[0]));
    const best = MENU.filter((m) => m.tags?.includes("bestseller")).slice(0, 4);
    const picks = best.map((b) => `${b.name} (${formatPKR(b.price)})`).join(", ");
    return {
      reply: cat
        ? `Opening ${cat.label} for you. ${cat.blurb}`
        : `Our crowd favourites: ${picks}. Say the name of anything and I will add it to your cart.`,
      actions: [{ type: "show-menu", categoryId: cat?.id }],
    };
  }

  // ── greetings ──
  if (/\b(hi|hello|hey|salam|assalam|aoa)\b/.test(text) || text.length < 4) {
    return {
      reply:
        "Assalam-o-alaikum! I take orders at FOUR. Tell me what you are craving, like \"a Bangkok Chipotle with large fries and a coke\", and I will get it in your cart.",
      actions: [],
    };
  }

  // ── fallback ──
  return {
    reply:
      "I did not catch a dish there. You can say things like \"2 New York Smash and cheese wings\", \"what's in my cart\", or \"checkout\".",
    actions: [],
  };
}

/** Rebuild a CartView from raw store lines (client-side helper). */
export function toCartView(lines: { itemId: string; variantId?: string; qty: number }[]): CartView {
  const out: CartView = { lines: [], total: 0 };
  for (const l of lines) {
    const item = findItem(l.itemId);
    if (!item) continue;
    const price = priceOf(item, l.variantId);
    out.lines.push({ ...l, label: labelOf(item, l.variantId), lineTotal: price * l.qty });
    out.total += price * l.qty;
  }
  return out;
}
