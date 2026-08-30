/**
 * Reliability queue between orders and the POS bridge.
 *
 * A submit that fails for a *configuration* reason (missing credentials) is
 * hopeless, so the order is cancelled loudly right away - exactly the old
 * behavior. A *transient* failure (gateway 5xx, network) instead leaves the
 * order CONFIRMED and retries in the background with backoff; only when the
 * retries are exhausted is the order cancelled, with the customer told on
 * their tracking page and phone. Orders are never silently dropped either way.
 *
 * In-process, which matches the single-node deployment; the boot sweep picks
 * up anything a restart stranded mid-retry.
 */
import { prisma, OrderStatus, PosStatus } from "@four/db";
import { BRANCHES } from "@four/shared";
import { activePosAdapter } from "./adapters.js";
import type { PosOrder, PosResult } from "./types.js";

/** Exported so tests can shrink the waits. */
export const RETRY_DELAYS_MS = [10_000, 30_000, 60_000, 120_000];

export interface SubmitOutcome {
  ok: boolean;
  /** true when retrying cannot help (misconfiguration) - the order was cancelled. */
  permanent?: boolean;
}

function isPermanent(error: string | undefined): boolean {
  return /not configured/i.test(error ?? "");
}

/** Set by the app so the queue can reuse the one status pipeline (emits + notify). */
type CancelFn = (orderNumber: string) => Promise<unknown>;
let cancelOrder: CancelFn = async (orderNumber) => {
  await prisma.order.update({
    where: { orderNumber },
    data: { status: OrderStatus.CANCELLED, events: { create: { status: OrderStatus.CANCELLED } } },
  });
};
export function onPosGiveUp(fn: CancelFn): void {
  cancelOrder = fn;
}

export async function submitToPos(orderId: string): Promise<SubmitOutcome> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { lines: true } });
  // already sent, cancelled meanwhile, or awaiting payment: nothing to do
  if (!order || order.posStatus !== PosStatus.PENDING) return { ok: true };
  if (order.status !== OrderStatus.CONFIRMED && order.status !== OrderStatus.PREPARING) return { ok: true };

  const adapter = activePosAdapter();
  let result: PosResult;
  try {
    result = await adapter.submitOrder(buildPosOrder(order));
  } catch (e) {
    result = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  if (result.ok) {
    await prisma.order.update({
      where: { id: order.id },
      data: { posStatus: PosStatus.SENT, posReference: result.posReference ?? null, posLastError: null },
    });
    return { ok: true };
  }

  const attempts = order.posAttempts + 1;
  const giveUp = isPermanent(result.error) || attempts > RETRY_DELAYS_MS.length;
  await prisma.order.update({
    where: { id: order.id },
    data: {
      posAttempts: attempts,
      posLastError: result.error ?? "unknown POS error",
      ...(giveUp ? { posStatus: PosStatus.FAILED } : {}),
    },
  });

  if (giveUp) {
    console.error(`[pos] giving up on ${order.orderNumber} after ${attempts} attempt(s): ${result.error}`);
    await cancelOrder(order.orderNumber);
    return { ok: false, permanent: true };
  }

  const delay = RETRY_DELAYS_MS[attempts - 1] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1]!;
  console.warn(`[pos] ${order.orderNumber} submit failed (attempt ${attempts}), retrying in ${delay / 1000}s: ${result.error}`);
  const t = setTimeout(() => void submitToPos(orderId), delay);
  t.unref?.();
  return { ok: false };
}

/**
 * Boot sweep: a restart loses in-flight timers, so re-drive recent PENDING
 * orders and cancel ones old enough that the food would never arrive on time.
 */
export async function sweepPendingPos(): Promise<void> {
  const cutoff = new Date(Date.now() - 15 * 60 * 1000);
  const pending = await prisma.order.findMany({
    where: {
      posStatus: PosStatus.PENDING,
      status: { in: [OrderStatus.CONFIRMED, OrderStatus.PREPARING] },
    },
    select: { id: true, orderNumber: true, placedAt: true },
  });
  for (const o of pending) {
    if (o.placedAt < cutoff) {
      console.error(`[pos] cancelling ${o.orderNumber}: stuck un-submitted through a restart`);
      await prisma.order.update({ where: { id: o.id }, data: { posStatus: PosStatus.FAILED } });
      await cancelOrder(o.orderNumber);
    } else {
      void submitToPos(o.id);
    }
  }
}

export function buildPosOrder(order: {
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
}): PosOrder {
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
