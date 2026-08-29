/**
 * Keyless deterministic assistant - used when OPENAI_API_KEY is absent or
 * OpenAI errors. Span-consuming alias matcher over the same tool executor:
 * "a chipotle bangkok burger with large fries and a coke" resolves each
 * dish (longest alias wins, spans are consumed so words aren't counted
 * twice), reads quantities and sizes near each match, and drives the same
 * cart as the LLM path.
 */
import { MENU_ITEMS, formatPKR, type MenuItemData } from "@four/shared";
import type { SessionContext } from "../plugins/session.js";
import { executeTool, type ToolOutcome } from "./tools.js";

export interface BotStep {
  toolName: string;
  outcome: ToolOutcome;
}

export interface BotReply {
  content: string;
  steps: BotStep[];
}

const QTY_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, ek: 1, two: 2, do: 2, three: 3, teen: 3, four: 4, char: 4,
  five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, couple: 2,
};

const SIZE_WORDS: Record<string, string[]> = {
  small: ["small"],
  regular: ["small"],
  medium: ["medium"],
  large: ["large"],
  big: ["large"],
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

interface AliasMatch {
  item: MenuItemData;
  alias: string;
  start: number;
  end: number;
}

/** Non-overlapping alias matches, longest aliases first. Indexes are in padded space. */
function matchItems(text: string): AliasMatch[] {
  const padded = ` ${text} `;
  const candidates: AliasMatch[] = [];
  const aliases = MENU_ITEMS.flatMap((item) => item.aliases.map((alias) => ({ item, alias }))).sort(
    (a, b) => b.alias.length - a.alias.length,
  );
  const consumed: [number, number][] = [];
  const overlaps = (s: number, e: number) => consumed.some(([cs, ce]) => s < ce && e > cs);

  for (const { item, alias } of aliases) {
    let from = 0;
    for (;;) {
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
 * Quantity + size words in the ~4 tokens before a match, never looking past
 * the previous match's end so "large fries and coke" sizes the fries only.
 */
function readModifiers(text: string, match: AliasMatch, item: MenuItemData, floor: number): { qty: number; variantId?: string } {
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
  const after = normalize(text.slice(match.end - 1, match.end + 11)).split(" ")[0] ?? "";
  if (!variantId && SIZE_WORDS[after] && item.variants) {
    variantId = SIZE_WORDS[after].find((v) => item.variants!.some((iv) => iv.id === v));
  }
  if (!variantId && item.variants?.length) variantId = item.variants[0].id;
  return { qty, variantId };
}

async function run(ctx: SessionContext, name: string, args: Record<string, unknown>): Promise<BotStep> {
  return { toolName: name, outcome: await executeTool(ctx, name, args) };
}

export async function fallbackReply(ctx: SessionContext, raw: string): Promise<BotReply> {
  const text = normalize(raw);
  const steps: BotStep[] = [];

  // ── track order ──
  const orderNo = raw.match(/FOUR-?\s?(\d{6})/i);
  if (orderNo || /\b(track|where.*order|order status|status|kahan|kidhar)\b/.test(text)) {
    const step = await run(ctx, "trackOrder", orderNo ? { orderNumber: `FOUR-${orderNo[1]}` } : {});
    steps.push(step);
    const r = step.outcome.result as { found: boolean; orderNumber?: string; status?: string };
    if (!r.found) return { content: "I couldn't find an order on this device yet. Once you place one I can track it live.", steps };
    return {
      content: `Order ${r.orderNumber} is ${String(r.status).toLowerCase().replaceAll("_", " ")}. Opening live tracking for you.`,
      steps,
    };
  }

  // ── clear cart ──
  if (/\b(clear|empty|khali)\b/.test(text) && /\b(cart|basket|order)\b/.test(text)) {
    steps.push(await run(ctx, "clearCart", {}));
    return { content: "Done, your cart is empty. What are you craving?", steps };
  }

  // ── view cart ──
  if (/\b(cart|basket)\b/.test(text) && !/\b(add|remove|order|want|clear|empty)\b/.test(text)) {
    const step = await run(ctx, "viewCart", {});
    steps.push(step);
    const r = step.outcome.result as { itemCount: number; subtotalLabel: string; lines: { name: string; qty: number }[] };
    if (r.itemCount === 0) {
      return { content: 'Your cart is empty. Try: "a Bangkok Chipotle with fries and a cola".', steps };
    }
    const lines = r.lines.map((l) => `${l.qty}x ${l.name}`).join(", ");
    return { content: `You have ${lines}. Subtotal ${r.subtotalLabel}. Say "checkout" when you're ready.`, steps };
  }

  // ── remove ──
  const removeMatch = text.match(/\b(?:remove|take out|hatao|nikaal(?:o)?|minus)\b(.*)/);
  if (removeMatch && removeMatch[1].trim()) {
    const matches = matchItems(normalize(removeMatch[1]));
    if (matches.length > 0) {
      for (const m of matches) steps.push(await run(ctx, "removeFromCart", { itemId: m.item.id }));
      return { content: `Removed ${matches.map((m) => m.item.name).join(" and ")}.`, steps };
    }
    return { content: "I couldn't find that in your cart. Say \"what's in my cart\" to review it.", steps };
  }

  // ── checkout ──
  if (/\b(checkout|check out|place (?:my |the )?order|confirm|order (?:kar|kr) ?do)\b/.test(text)) {
    const payment = /\bcard\b/.test(text) ? "CARD" : "COD";
    const step = await run(ctx, "prepareOrder", { payment });
    steps.push(step);
    const r = step.outcome.result as { totalLabel?: string; error?: string };
    if (step.outcome.confirmAction) {
      return {
        content: `Your total is ${r.totalLabel} (${payment === "COD" ? "cash on delivery" : "card"}, tax included). I've opened checkout - fill in your address and place the order.`,
        steps,
      };
    }
    return { content: "Your cart is empty - tell me what you'd like first!", steps };
  }

  // ── delivery areas ──
  if (/\b(deliver|delivery|area|areas|location|address)\b/.test(text) && !/\b(order|want|add)\b/.test(text)) {
    steps.push(await run(ctx, "deliveryAreas", {}));
    return {
      content: "We deliver across Lahore: DHA Phases 1-8, Gulberg, Model Town, Allama Iqbal Town, Johar Town, Bahria and more. Set your block from the location button up top.",
      steps,
    };
  }

  // ── price question (before add, so asking a price never adds) ──
  if (/\b(?:how much|price|kitne|kitna|cost)\b/.test(text)) {
    const m = matchItems(text)[0];
    if (m) {
      const variants = m.item.variants?.map((v) => `${v.label} ${formatPKR(v.price)}`).join(", ");
      return {
        content: variants ? `${m.item.name}: ${variants}.` : `${m.item.name} is ${formatPKR(m.item.price)} (plus tax at checkout).`,
        steps,
      };
    }
  }

  // ── add / order ──
  const matches = matchItems(text);
  if (matches.length > 0) {
    const added: string[] = [];
    let prevEnd = 0;
    for (const m of matches.slice(0, 6)) {
      const { qty, variantId } = readModifiers(text, m, m.item, prevEnd);
      prevEnd = m.end;
      const step = await run(ctx, "addToCart", { itemId: m.item.id, variantId, qty });
      steps.push(step);
      const variantLabel = m.item.variants?.find((v) => v.id === variantId)?.label;
      added.push(`${qty > 1 ? `${qty}x ` : ""}${m.item.name}${variantLabel ? ` (${variantLabel})` : ""}`);
    }
    const view = await run(ctx, "viewCart", {});
    const subtotal = (view.outcome.result as { subtotalLabel: string }).subtotalLabel;
    return {
      content: `Added ${added.join(", ")}. Subtotal ${subtotal}. Anything else, or shall I take you to checkout?`,
      steps,
    };
  }

  // ── menu / recommendations ──
  if (/\b(menu|what do you have|kya hai|options|show|recommend|suggest|best ?seller|famous|popular)\b/.test(text)) {
    const step = await run(ctx, "getBestsellers", {});
    steps.push(step);
    const items = (step.outcome.result as { items: { name: string; priceLabel: string }[] }).items;
    const lines = items.slice(0, 5).map((i) => `${i.name} (${i.priceLabel})`).join(", ");
    return { content: `Crowd favourites: ${lines}. Say the name of anything and it's in your cart.`, steps };
  }

  // ── greetings ──
  if (/\b(hi|hello|hey|salam|assalam|aoa)\b/.test(text) || text.length < 4) {
    return {
      content:
        'Assalam-o-alaikum! I take orders at FOUR. Tell me what you\'re craving - like "a Bangkok Chipotle with fries and a cola" - and I\'ll get it in your cart.',
      steps,
    };
  }

  return {
    content:
      'I didn\'t catch a dish there. Try "2 Classic New York and cheese wings", "what\'s in my cart", or "checkout".',
    steps,
  };
}
