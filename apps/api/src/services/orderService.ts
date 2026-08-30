/**
 * Order pipeline. The bot (or checkout UI) first requests a QUOTE, which
 * returns totals plus an HMAC confirm token bound to session + cart hash +
 * payment method; placing the order requires that token, so a stale or
 * tampered cart can never be committed (bestbuy's confirm rail).
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { createHash } from "node:crypto";
import { prisma, OrderStatus, type PaymentMethod } from "@four/db";
import {
  BRAND,
  DELIVERY_FEE,
  FREE_DELIVERY_ABOVE,
  BRANCHES,
  LAHORE_AREAS,
  areaCoords,
  branchForArea,
  OPENS_AT_MINUTES,
  deliveryEtaLabel,
  isOpenAt,
  type CheckoutInput,
  type OrderQuote,
  type OrderView,
} from "@four/shared";
import { config } from "../config.js";
import { emitToSession, emitToOrder, emitToAdmin } from "../realtime/io.js";
import { activePosAdapter } from "../pos/adapters.js";
import * as cartService from "./cartService.js";

class OrderError extends Error {
  constructor(
    message: string,
    public code = "ORDER_ERROR",
  ) {
    super(message);
  }
}

function taxRate(payment: PaymentMethod): number {
  return payment === "CARD" ? config.TAX_RATE_CARD : config.TAX_RATE_COD;
}

function cartSignature(sessionId: string, subtotal: number, itemCount: number, payment: string): string {
  return createHmac("sha256", config.APP_SECRET)
    .update(`${sessionId}:${subtotal}:${itemCount}:${payment}`)
    .digest("base64url");
}

export async function quote(sessionId: string, payment: PaymentMethod): Promise<OrderQuote> {
  const cart = await cartService.viewCart(sessionId);
  if (cart.lines.length === 0) throw new OrderError("Cart is empty", "EMPTY_CART");
  const rate = taxRate(payment);
  const deliveryFee = cart.subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
  const tax = Math.round(cart.subtotal * rate);
  return {
    subtotal: cart.subtotal,
    deliveryFee,
    taxRate: rate,
    tax,
    total: cart.subtotal + deliveryFee + tax,
    payment,
    confirmToken: cartSignature(sessionId, cart.subtotal, cart.itemCount, payment),
  };
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits.startsWith("+92") ? `0${digits.slice(3)}` : digits;
}

/** ~±120m deterministic jitter so same-area pins don't stack. */
function jitteredAreaCoords(areaId: string, seed: string): { lat: number; lng: number } {
  const base = areaCoords(areaId);
  const h = createHash("sha1").update(seed).digest();
  return {
    lat: base.lat + ((h[0]! / 255) * 2 - 1) * 0.0011,
    lng: base.lng + ((h[1]! / 255) * 2 - 1) * 0.0011,
  };
}

/** Undefined rather than a guess if the area is no longer in the coverage list. */
function etaForArea(areaId: string): string | undefined {
  const area = LAHORE_AREAS.find((a) => a.id === areaId);
  return area ? deliveryEtaLabel(area.distanceKm) : undefined;
}

function orderNumber(): string {
  return `FOUR-${Math.floor(100000 + Math.random() * 900000)}`;
}

function openingTimeLabel(): string {
  const h = Math.floor(OPENS_AT_MINUTES / 60);
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(OPENS_AT_MINUTES % 60).padStart(2, "0")} ${suffix}`;
}

export async function placeOrder(sessionId: string, input: CheckoutInput): Promise<OrderView> {
  // the kitchen is shut, so nobody would cook this. Checked here rather than
  // only in the UI because this is the endpoint that actually commits an order.
  if (!config.FORCE_OPEN && !isOpenAt()) {
    throw new OrderError(`The kitchen is closed. We reopen at ${openingTimeLabel()} - please order then.`, "CLOSED");
  }

  const area = LAHORE_AREAS.find((a) => a.id === input.areaId);
  if (!area || !area.blocks.includes(input.block)) {
    throw new OrderError("We do not deliver to that area yet", "OUT_OF_ZONE");
  }

  const cart = await cartService.viewCart(sessionId);
  if (cart.lines.length === 0) throw new OrderError("Cart is empty", "EMPTY_CART");

  const expected = cartSignature(sessionId, cart.subtotal, cart.itemCount, input.payment);
  const a = Buffer.from(expected);
  const b = Buffer.from(input.confirmToken);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new OrderError("Your cart changed - please review the total and confirm again", "STALE_QUOTE");
  }

  const rate = taxRate(input.payment);
  const deliveryFee = cart.subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
  const tax = Math.round(cart.subtotal * rate);
  const total = cart.subtotal + deliveryFee + tax;

  // route to the branch covering the area; pin the destination for the rider map
  const branch = branchForArea(area.id);
  const num = orderNumber();
  const dest = jitteredAreaCoords(area.id, num);

  // guest checkout implicitly creates/updates the customer account (phone = identity)
  const phone = normalizePhone(input.phone);
  const customer = await prisma.customer.upsert({
    where: { phone },
    create: { phone, name: input.name },
    update: { name: input.name },
  });
  await prisma.session.update({ where: { id: sessionId }, data: { customerId: customer.id } }).catch(() => {});

  const order = await prisma.order.create({
    data: {
      orderNumber: num,
      sessionId,
      branchId: branch.id,
      customerId: customer.id,
      destLat: dest.lat,
      destLng: dest.lng,
      customerName: input.name,
      phone,
      areaId: area.id,
      areaName: area.name,
      block: input.block,
      address: input.address,
      note: input.note,
      payment: input.payment,
      subtotal: cart.subtotal,
      deliveryFee,
      taxRate: rate,
      tax,
      total,
      events: { create: { status: OrderStatus.CONFIRMED } },
      lines: {
        create: cart.lines.map((l) => ({
          itemId: l.itemId,
          name: l.name,
          variantLabel: l.variantLabel,
          modifiers: l.modifiers.map((m) => (m.qty > 1 ? `${m.label} x${m.qty}` : m.label)),
          qty: l.qty,
          unitPrice: l.unitPrice,
          lineTotal: l.lineTotal,
        })),
      },
    },
    include: { lines: true, events: true },
  });

  // hand off to the POS; a failure cancels the order loudly rather than losing it
  const adapter = activePosAdapter();
  const result = await adapter.submitOrder(toPosOrder(order));
  if (!result.ok) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.CANCELLED, events: { create: { status: OrderStatus.CANCELLED } } },
    });
    throw new OrderError(
      `We could not reach the kitchen, so nothing has been charged. Please order again, or call us on ${BRAND.phone}.`,
      "POS_DOWN",
    );
  }
  if (result.posReference) {
    await prisma.order.update({ where: { id: order.id }, data: { posReference: result.posReference } });
  }

  await cartService.clearCart(sessionId);
  emitToAdmin("admin:order:new", { orderNumber: order.orderNumber });
  return getOrder(order.orderNumber) as Promise<OrderView>;
}

export async function getOrder(orderNumberOrId: string): Promise<OrderView | null> {
  const order = await prisma.order.findFirst({
    where: { OR: [{ orderNumber: orderNumberOrId }, { id: orderNumberOrId }] },
    include: { lines: true, events: { orderBy: { at: "asc" } }, branch: true, rider: true },
  });
  if (!order) return null;
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    placedAt: order.placedAt.toISOString(),
    branchId: order.branchId ?? undefined,
    branchName: order.branch?.shortName ?? undefined,
    riderName: order.rider?.name ?? undefined,
    destLat: order.destLat ?? undefined,
    destLng: order.destLng ?? undefined,
    customerName: order.customerName,
    phone: order.phone,
    areaName: order.areaName,
    block: order.block,
    address: order.address,
    note: order.note ?? undefined,
    payment: order.payment,
    etaLabel: etaForArea(order.areaId),
    lines: order.lines.map((l) => ({
      name: l.name,
      variantLabel: l.variantLabel ?? undefined,
      modifiers: (l.modifiers as string[]) ?? [],
      qty: l.qty,
      unitPrice: l.unitPrice,
      lineTotal: l.lineTotal,
    })),
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    tax: order.tax,
    total: order.total,
    events: order.events.map((e) => ({ status: e.status, at: e.at.toISOString() })),
  };
}

export async function ordersForSession(sessionId: string): Promise<OrderView[]> {
  const session = await prisma.session.findUnique({ where: { id: sessionId }, select: { customerId: true } });
  const orders = await prisma.order.findMany({
    where: session?.customerId ? { OR: [{ customerId: session.customerId }, { sessionId }] } : { sessionId },
    orderBy: { placedAt: "desc" },
    take: 25,
    select: { orderNumber: true },
  });
  const views = await Promise.all(orders.map((o) => getOrder(o.orderNumber)));
  return views.filter((v): v is OrderView => v !== null);
}

export async function latestOrderForSession(sessionId: string): Promise<OrderView | null> {
  const order = await prisma.order.findFirst({
    where: { sessionId },
    orderBy: { placedAt: "desc" },
    select: { orderNumber: true },
  });
  return order ? getOrder(order.orderNumber) : null;
}

export async function updateStatus(orderNumber: string, status: OrderStatus): Promise<OrderView> {
  const order = await prisma.order.findUnique({ where: { orderNumber } });
  if (!order) throw new OrderError("Order not found", "NOT_FOUND");
  await prisma.order.update({
    where: { id: order.id },
    data: { status, events: { create: { status } } },
  });
  const at = new Date().toISOString();
  emitToOrder(orderNumber, "order:status", { orderNumber, status, at });
  if (order.sessionId) emitToSession(order.sessionId, "order:status", { orderNumber, status, at });
  emitToAdmin("admin:order:updated", { orderNumber, status });
  return getOrder(orderNumber) as Promise<OrderView>;
}

export async function listOrders(limit = 50, branchId?: string) {
  return prisma.order.findMany({
    where: branchId ? { branchId } : undefined,
    orderBy: { placedAt: "desc" },
    take: limit,
    include: { lines: true, rider: true, branch: true },
  });
}

export async function assignRider(orderNumberArg: string, riderId: string | null): Promise<OrderView> {
  const order = await prisma.order.findUnique({ where: { orderNumber: orderNumberArg } });
  if (!order) throw new OrderError("Order not found", "NOT_FOUND");
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { riderId },
    include: { rider: true },
  });
  if (updated.rider) {
    emitToOrder(orderNumberArg, "rider:assigned", { orderNumber: orderNumberArg, riderName: updated.rider.name });
  }
  emitToAdmin("admin:order:updated", { orderNumber: orderNumberArg, status: updated.status });
  return getOrder(orderNumberArg) as Promise<OrderView>;
}

function toPosOrder(order: {
  orderNumber: string;
  placedAt: Date;
  branchId: string | null;
  customerName: string;
  phone: string;
  areaId: string;
  areaName: string;
  block: string;
  address: string;
  note: string | null;
  payment: string;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  lines: { itemId: string; name: string; variantLabel: string | null; modifiers: unknown; qty: number; unitPrice: number }[];
}) {
  const branch = BRANCHES.find((b) => b.id === order.branchId);
  return {
    orderNumber: order.orderNumber,
    placedAt: order.placedAt.toISOString(),
    branch: branch ? { id: branch.id, name: branch.name } : undefined,
    customer: { name: order.customerName, phone: order.phone },
    delivery: {
      areaId: order.areaId,
      areaName: order.areaName,
      block: order.block,
      address: order.address,
      note: order.note ?? undefined,
    },
    payment: order.payment as "COD" | "CARD",
    lines: order.lines.map((l) => ({
      itemId: l.itemId,
      name: l.name,
      variant: l.variantLabel ?? undefined,
      modifiers: (l.modifiers as string[]) ?? [],
      qty: l.qty,
      unitPrice: l.unitPrice,
    })),
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    tax: order.tax,
    total: order.total,
    source: "web" as const,
  };
}
