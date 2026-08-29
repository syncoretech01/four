/**
 * Cart engine. All prices resolve server-side from the DB; modifier prices
 * support flat and size-dependent values (pizza toppings). Every mutation
 * broadcasts cart:updated to the owning session's socket room so the UI
 * (including bot-driven changes) updates live.
 */
import { prisma, type Prisma } from "@four/db";
import { modifierSelectionSchema, type CartAddInput, type CartView, type CartLineView, type ModifierSelection } from "@four/shared";
import { emitToSession } from "../realtime/io.js";

class CartError extends Error {
  constructor(
    message: string,
    public code = "CART_ERROR",
  ) {
    super(message);
  }
}

const lineInclude = {
  item: { include: { variants: true, modifierGroups: { include: { group: { include: { options: true } } } } } },
};
type LineWithItem = Prisma.CartLineGetPayload<{ include: typeof lineInclude }>;

function modifierPrice(price: unknown, variantSlug: string | undefined): number {
  const p = price as { flat?: number; bySize?: Record<string, number> };
  if (typeof p.flat === "number") return p.flat;
  if (p.bySize) {
    if (variantSlug && p.bySize[variantSlug] !== undefined) return p.bySize[variantSlug];
    return Math.min(...Object.values(p.bySize));
  }
  return 0;
}

function priceLine(line: LineWithItem): CartLineView {
  const variant = line.variantId ? line.item.variants.find((v) => v.id === line.variantId) : undefined;
  const variantSlug = variant?.slug;
  let unitPrice = variant?.price ?? line.item.basePrice;

  const selections = (line.modifiers as ModifierSelection[] | null) ?? [];
  const modifierViews: CartLineView["modifiers"] = [];
  for (const sel of selections) {
    const group = line.item.modifierGroups.find((g) => g.group.id === sel.groupId)?.group;
    const option = group?.options.find((o) => o.id === `${sel.groupId}:${sel.optionId}` || o.slug === sel.optionId);
    if (!group || !option) continue;
    const price = modifierPrice(option.price, variantSlug);
    unitPrice += price * sel.qty;
    modifierViews.push({ groupId: group.id, optionId: option.slug, label: option.label, price, qty: sel.qty });
  }

  return {
    lineId: line.id,
    itemId: line.itemId,
    name: line.item.name,
    variantId: line.variantId ?? undefined,
    variantLabel: variant?.label,
    modifiers: modifierViews,
    qty: line.qty,
    unitPrice,
    lineTotal: unitPrice * line.qty,
    image: line.item.image ?? undefined,
  };
}

async function loadCart(sessionId: string) {
  return prisma.cart.upsert({
    where: { sessionId },
    create: { sessionId },
    update: {},
    include: { lines: { include: lineInclude, orderBy: { id: "asc" } } },
  });
}

export async function viewCart(sessionId: string): Promise<CartView> {
  const cart = await loadCart(sessionId);
  const lines = cart.lines.map(priceLine);
  return {
    lines,
    subtotal: lines.reduce((s, l) => s + l.lineTotal, 0),
    itemCount: lines.reduce((s, l) => s + l.qty, 0),
  };
}

async function broadcast(sessionId: string): Promise<CartView> {
  const view = await viewCart(sessionId);
  emitToSession(sessionId, "cart:updated", view);
  return view;
}

export async function addToCart(sessionId: string, input: CartAddInput): Promise<CartView> {
  const item = await prisma.menuItem.findUnique({
    where: { id: input.itemId },
    include: { variants: true, modifierGroups: { include: { group: { include: { options: true } } } } },
  });
  if (!item) throw new CartError(`Unknown menu item: ${input.itemId}`, "UNKNOWN_ITEM");
  if (!item.available) throw new CartError(`${item.name} is currently unavailable`, "UNAVAILABLE");

  let variantId: string | undefined;
  if (item.variants.length > 0) {
    const wanted = input.variantId ?? item.variants[0].slug;
    const variant = item.variants.find((v) => v.id === wanted || v.slug === wanted);
    if (!variant) throw new CartError(`Unknown size for ${item.name}`, "UNKNOWN_VARIANT");
    variantId = variant.id;
  } else if (input.variantId) {
    throw new CartError(`${item.name} has no size options`, "UNKNOWN_VARIANT");
  }

  // validate modifiers against the item's groups
  const selections = input.modifiers.map((m) => modifierSelectionSchema.parse(m));
  for (const sel of selections) {
    const group = item.modifierGroups.find((g) => g.group.id === sel.groupId)?.group;
    if (!group) throw new CartError(`${item.name} does not offer ${sel.groupId}`, "UNKNOWN_MODIFIER");
    const option = group.options.find((o) => o.slug === sel.optionId);
    if (!option) throw new CartError(`Unknown option ${sel.optionId} in ${group.label}`, "UNKNOWN_MODIFIER");
  }
  const perGroupCount = new Map<string, number>();
  for (const sel of selections) {
    const n = (perGroupCount.get(sel.groupId) ?? 0) + sel.qty;
    perGroupCount.set(sel.groupId, n);
    const group = item.modifierGroups.find((g) => g.group.id === sel.groupId)!.group;
    if (n > group.maxSelections) throw new CartError(`Too many selections for ${group.label}`, "MODIFIER_LIMIT");
  }

  const cart = await loadCart(sessionId);
  const modifiersJson = JSON.stringify(selections);
  const existing = cart.lines.find(
    (l) => l.itemId === item.id && (l.variantId ?? null) === (variantId ?? null) && JSON.stringify(l.modifiers ?? []) === modifiersJson,
  );
  if (existing) {
    await prisma.cartLine.update({
      where: { id: existing.id },
      data: { qty: Math.min(20, existing.qty + input.qty) },
    });
  } else {
    await prisma.cartLine.create({
      data: { cartId: cart.id, itemId: item.id, variantId, modifiers: selections, qty: input.qty },
    });
  }
  return broadcast(sessionId);
}

export async function setLineQty(sessionId: string, lineId: string, qty: number): Promise<CartView> {
  const cart = await loadCart(sessionId);
  const line = cart.lines.find((l) => l.id === lineId);
  if (!line) throw new CartError("Cart line not found", "UNKNOWN_LINE");
  if (qty <= 0) await prisma.cartLine.delete({ where: { id: line.id } });
  else await prisma.cartLine.update({ where: { id: line.id }, data: { qty: Math.min(20, qty) } });
  return broadcast(sessionId);
}

/** Remove every line of an item (bot-friendly: "remove the fries"). */
export async function removeItem(sessionId: string, itemId: string): Promise<CartView> {
  const cart = await loadCart(sessionId);
  await prisma.cartLine.deleteMany({ where: { cartId: cart.id, itemId } });
  return broadcast(sessionId);
}

export async function clearCart(sessionId: string): Promise<CartView> {
  const cart = await loadCart(sessionId);
  await prisma.cartLine.deleteMany({ where: { cartId: cart.id } });
  return broadcast(sessionId);
}
