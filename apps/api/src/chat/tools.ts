/**
 * Assistant tools. Each tool executes against the SAME services as the REST
 * routes, so bot-driven mutations broadcast the same socket events and the
 * UI updates instantly. `prepareOrder` only returns a QUOTE + confirm token;
 * the order is committed exclusively by the customer completing checkout.
 */
import { MENU_ITEMS, MENU_CATEGORIES, LAHORE_AREAS, formatPKR, type OrderQuote } from "@four/shared";
import { config } from "../config.js";
import type { SessionContext } from "../plugins/session.js";
import * as menuService from "../services/menuService.js";
import * as cartService from "../services/cartService.js";
import * as orderService from "../services/orderService.js";

export interface ToolOutcome {
  result: unknown;
  label: string;
  navigateTo?: string;
  confirmAction?: { type: "checkout"; quote: OrderQuote } | null;
}

export const TOOL_DEFS = [
  {
    name: "searchMenu",
    description: "Search the FOUR menu by dish name or keywords (e.g. 'bangkok chipotle', 'fries', 'pizza').",
    parameters: {
      type: "object",
      properties: {
        q: { type: "string" },
        limit: { type: "integer", minimum: 1, maximum: 10, default: 5 },
      },
      required: ["q"],
    },
  },
  {
    name: "getItem",
    description: "Full details for one menu item by id, including sizes and add-on groups.",
    parameters: { type: "object", properties: { itemId: { type: "string" } }, required: ["itemId"] },
  },
  {
    name: "addToCart",
    description:
      "Add a dish to the cart. variantId is the size slug when the item has sizes (small/medium/large). modifiers add meal deals or add-ons, e.g. [{groupId:'meal-deal',optionId:'fries-soda',qty:1}].",
    parameters: {
      type: "object",
      properties: {
        itemId: { type: "string" },
        variantId: { type: "string" },
        qty: { type: "integer", minimum: 1, maximum: 20, default: 1 },
        modifiers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              groupId: { type: "string" },
              optionId: { type: "string" },
              qty: { type: "integer", minimum: 1, maximum: 5, default: 1 },
            },
            required: ["groupId", "optionId"],
          },
        },
      },
      required: ["itemId"],
    },
  },
  {
    name: "removeFromCart",
    description: "Remove every line of an item from the cart by itemId.",
    parameters: { type: "object", properties: { itemId: { type: "string" } }, required: ["itemId"] },
  },
  { name: "viewCart", description: "Current cart contents and subtotal.", parameters: { type: "object", properties: {} } },
  { name: "clearCart", description: "Empty the cart.", parameters: { type: "object", properties: {} } },
  {
    name: "prepareOrder",
    description:
      "Prepare the order for checkout: returns subtotal, delivery fee, tax and total for the chosen payment method, and opens the checkout panel. The customer completes it themselves.",
    parameters: {
      type: "object",
      properties: { payment: { type: "string", enum: ["COD", "CARD"], default: "COD" } },
    },
  },
  {
    name: "trackOrder",
    description: "Track an order's live status. Without an orderNumber, tracks this customer's latest order.",
    parameters: { type: "object", properties: { orderNumber: { type: "string" } } },
  },
  {
    name: "getBestsellers",
    description: "The crowd-favourite dishes.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "deliveryAreas",
    description: "List the Lahore areas FOUR delivers to.",
    parameters: { type: "object", properties: {} },
  },
];

export async function executeTool(
  ctx: SessionContext,
  name: string,
  args: Record<string, unknown>,
): Promise<ToolOutcome> {
  switch (name) {
    case "searchMenu": {
      const items = await menuService.searchItems(String(args.q ?? ""), Number(args.limit ?? 5));
      return {
        result: {
          items: items.map((i) => ({
            id: i.id,
            name: i.name,
            price: i.basePrice,
            priceLabel: formatPKR(i.basePrice),
            sizes: i.variants.map((v) => ({ slug: v.slug, label: v.label, price: v.price })),
            available: i.available,
          })),
        },
        label: `Searched "${String(args.q ?? "")}"`,
      };
    }
    case "getItem": {
      const item = await menuService.getItem(String(args.itemId ?? ""));
      return { result: item ?? { error: "not found" }, label: item ? `Looked up ${item.name}` : "Item not found" };
    }
    case "addToCart": {
      const cart = await cartService.addToCart(ctx.sessionId, {
        itemId: String(args.itemId ?? ""),
        variantId: args.variantId ? String(args.variantId) : undefined,
        qty: Math.max(1, Math.min(20, Number(args.qty ?? 1))),
        modifiers: Array.isArray(args.modifiers)
          ? (args.modifiers as { groupId: string; optionId: string; qty?: number }[]).map((m) => ({
              groupId: String(m.groupId),
              optionId: String(m.optionId),
              qty: Math.max(1, Math.min(5, Number(m.qty ?? 1))),
            }))
          : [],
      });
      return {
        result: { itemCount: cart.itemCount, subtotal: cart.subtotal, subtotalLabel: formatPKR(cart.subtotal) },
        label: "Added to cart",
      };
    }
    case "removeFromCart": {
      const cart = await cartService.removeItem(ctx.sessionId, String(args.itemId ?? ""));
      return {
        result: { itemCount: cart.itemCount, subtotal: cart.subtotal, subtotalLabel: formatPKR(cart.subtotal) },
        label: "Removed from cart",
      };
    }
    case "viewCart": {
      const cart = await cartService.viewCart(ctx.sessionId);
      return {
        result: {
          lines: cart.lines.map((l) => ({
            itemId: l.itemId,
            name: l.variantLabel ? `${l.name} (${l.variantLabel})` : l.name,
            modifiers: l.modifiers.map((m) => m.label),
            qty: l.qty,
            lineTotal: l.lineTotal,
          })),
          itemCount: cart.itemCount,
          subtotal: cart.subtotal,
          subtotalLabel: formatPKR(cart.subtotal),
        },
        label: "Checked the cart",
      };
    }
    case "clearCart": {
      await cartService.clearCart(ctx.sessionId);
      return { result: { ok: true }, label: "Cleared the cart" };
    }
    case "prepareOrder": {
      const payment = args.payment === "CARD" ? "CARD" : "COD";
      const q = await orderService.quote(ctx.sessionId, payment);
      return {
        result: {
          subtotal: q.subtotal,
          deliveryFee: q.deliveryFee,
          tax: q.tax,
          taxRatePct: Math.round(q.taxRate * 100),
          total: q.total,
          totalLabel: formatPKR(q.total),
          payment,
        },
        label: "Prepared checkout",
        confirmAction: { type: "checkout", quote: q },
      };
    }
    case "trackOrder": {
      const order = args.orderNumber
        ? await orderService.getOrder(String(args.orderNumber).toUpperCase())
        : await orderService.latestOrderForSession(ctx.sessionId);
      if (!order) return { result: { found: false }, label: "No order found" };
      return {
        result: { found: true, orderNumber: order.orderNumber, status: order.status, total: order.total },
        label: `Tracked ${order.orderNumber}`,
        navigateTo: `/track/${order.orderNumber}`,
      };
    }
    case "getBestsellers": {
      const best = MENU_ITEMS.filter((m) => m.tags?.includes("bestseller"));
      return {
        result: { items: best.map((b) => ({ id: b.id, name: b.name, priceLabel: formatPKR(b.price) })) },
        label: "Fetched bestsellers",
      };
    }
    case "deliveryAreas": {
      return {
        result: { areas: LAHORE_AREAS.map((a) => a.name) },
        label: "Listed delivery areas",
      };
    }
    default:
      return { result: { error: `unknown tool ${name}` }, label: `Unknown tool ${name}` };
  }
}

const MENU_SUMMARY = MENU_CATEGORIES.map((cat) => {
  const items = MENU_ITEMS.filter((i) => i.category === cat.id)
    .map((i) => {
      const sizes = i.variants?.map((v) => `${v.label} ${v.price}`).join("/");
      return `${i.name} [${i.id}] ${sizes ? `(${sizes})` : i.price}`;
    })
    .join("; ");
  return `${cat.label}: ${items}`;
}).join("\n");

const SHARED_RULES = `You are the FOUR ordering assistant. FOUR is a fast-food restaurant at Fairways, DHA Phase 6, Lahore, famous for smash burgers and crown-crust pizzas - all made from scratch in three Lahore kitchens.
Personality: warm, playful, a little cheeky (brand voice: "Crust me, I'm worth it"), but always efficient. Mirror the customer's language: reply in English, Urdu, or Roman Urdu to match them.
Prices are in PKR and exclusive of tax; tax is added at checkout (${Math.round(config.TAX_RATE_COD * 100)}% cash, ${Math.round(config.TAX_RATE_CARD * 100)}% card).
Use tools for every menu lookup and cart change - never invent items or prices. Item ids are in [brackets] below.
Burgers can be made a meal (meal-deal group) and take add-ons; pizzas take extra toppings priced by size.
To finish an order call prepareOrder; the customer completes checkout themselves - you can never place an order for them.
Never offer, invent or negotiate a discount, free item, or promotion, and never imply a price could be lower. Prices come from the server and you cannot change them, so promising one would be a promise FOUR has to break. If asked for a discount, say warmly that prices are fixed and point them at what is good value.

MENU (id in brackets, prices PKR):
${MENU_SUMMARY}`;

export const CHAT_SYSTEM_PROMPT = `${SHARED_RULES}

Keep replies short (1-3 sentences), use bullet lists only for menu options. After adding to cart, confirm what was added and the running subtotal, then ask if they want anything else or checkout.`;

export const VOICE_SYSTEM_PROMPT = `${SHARED_RULES}

You are on a VOICE call: speak naturally, one or two short sentences at a time, never read long lists (offer the top 2-3 options instead). Say prices as "rupees". Confirm each item after adding it.`;

/** Realtime API tool format (flat, with type). */
export function realtimeTools() {
  return TOOL_DEFS.map((t) => ({ type: "function", name: t.name, description: t.description, parameters: t.parameters }));
}
