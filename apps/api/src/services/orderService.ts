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
import { submitToPos, onPosGiveUp } from "../pos/queue.js";
import { activePaymentProvider, demoPaymentToken } from "../payments/providers.js";
import { notifyOrderStatus } from "../notify/notifyService.js";
import * as cartService from "./cartService.js";

// the POS queue cancels through the one status pipeline so customers get
// the socket update and the phone message like any other cancellation
onPosGiveUp((orderNumber) => updateStatus(orderNumber, OrderStatus.CANCELLED));

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

  // an online-payment card order is held back from the kitchen until paid
  const provider = activePaymentProvider();
  const collectOnline = input.payment === "CARD" && provider.name !== "none";

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
      status: collectOnline ? OrderStatus.PENDING_PAYMENT : OrderStatus.CONFIRMED,
      subtotal: cart.subtotal,
      deliveryFee,
      taxRate: rate,
      tax,
      total,
      events: { create: { status: collectOnline ? OrderStatus.PENDING_PAYMENT : OrderStatus.CONFIRMED } },
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
  });

  if (collectOnline) {
    const init = await provider.createPayment({ orderNumber: num, total, customerName: input.name, phone });
    if (!init.ok || !init.redirectUrl) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CANCELLED, events: { create: { status: OrderStatus.CANCELLED } } },
      });
      throw new OrderError(
        `Card payment is unavailable right now - please pay cash on delivery, or call us on ${BRAND.phone}.`,
        "PAYMENT_DOWN",
      );
    }
    await prisma.order.update({ where: { id: order.id }, data: { paymentRef: init.paymentRef ?? null } });
    await cartService.clearCart(sessionId);
    // the kitchen is told once payment confirms, not now
    return getOrder(order.orderNumber) as Promise<OrderView>;
  }

  // hand off to the POS; misconfiguration cancels loudly right away, a
  // transient failure retries in the background (see pos/queue.ts)
  const outcome = await submitToPos(order.id);
  if (outcome.permanent) {
    throw new OrderError(
      `We could not reach the kitchen, so nothing has been charged. Please order again, or call us on ${BRAND.phone}.`,
      "POS_DOWN",
    );
  }

  await cartService.clearCart(sessionId);
  emitToAdmin("admin:order:new", { orderNumber: order.orderNumber });
  notifyOrderStatus({ orderNumber: num, phone, total }, "CONFIRMED");
  return getOrder(order.orderNumber) as Promise<OrderView>;
}

/**
 * Flips a PENDING_PAYMENT order to CONFIRMED and releases it to the kitchen.
 * Called by the payment confirm route (demo gateway or a real webhook).
 */
export async function confirmPayment(orderNumberArg: string): Promise<OrderView> {
  const order = await prisma.order.findUnique({ where: { orderNumber: orderNumberArg } });
  if (!order) throw new OrderError("Order not found", "NOT_FOUND");
  if (order.status !== OrderStatus.PENDING_PAYMENT) {
    // webhooks retry; confirming twice must not double-fire the kitchen
    return getOrder(orderNumberArg) as Promise<OrderView>;
  }
  await prisma.order.update({ where: { id: order.id }, data: { paidAt: new Date() } });
  const view = await updateStatus(orderNumberArg, OrderStatus.CONFIRMED);
  emitToAdmin("admin:order:new", { orderNumber: orderNumberArg });
  void submitToPos(order.id);
  return view;
}

/** True when the demo-gateway token authorizes paying this order. */
export function validDemoPayToken(orderNumber: string, token: string): boolean {
  const expected = Buffer.from(demoPaymentToken(orderNumber));
  const got = Buffer.from(token);
  return expected.length === got.length && timingSafeEqual(expected, got);
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
    // where to finish paying, for orders still held at the gateway
    paymentUrl:
      order.status === OrderStatus.PENDING_PAYMENT && config.PAYMENT_PROVIDER === "demo"
        ? `${config.WEB_ORIGIN}/pay/${order.orderNumber}?t=${demoPaymentToken(order.orderNumber)}`
        : undefined,
    etaLabel: etaForArea(order.areaId),
    lines: order.lines.map((l) => ({
      itemId: l.itemId,
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

/**
 * A viewer may see an order only if this browser session placed it, or the
 * signed-in customer owns it, or the viewer is staff (admin) or the assigned
 * rider. Order numbers are short and enumerable, so without this check any
 * visitor could harvest customers' names, phones and home addresses by
 * walking order numbers.
 */
export async function sessionCanViewOrder(
  session: { sessionId: string; isAdmin: boolean; riderId: string | null },
  orderNumber: string,
): Promise<boolean> {
  if (session.isAdmin) return true;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: { sessionId: true, customerId: true, riderId: true },
  });
  if (!order) return false;
  if (order.sessionId && order.sessionId === session.sessionId) return true;
  if (session.riderId && order.riderId === session.riderId) return true;
  if (order.customerId) {
    const me = await prisma.session.findUnique({ where: { id: session.sessionId }, select: { customerId: true } });
    if (me?.customerId && me.customerId === order.customerId) return true;
  }
  return false;
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
  notifyOrderStatus({ orderNumber, phone: order.phone, total: order.total }, status);
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

