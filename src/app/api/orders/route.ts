import { NextResponse } from "next/server";
import { z } from "zod";
import { DELIVERY_FEE, FREE_DELIVERY_ABOVE, findItem } from "@/data/menu";
import { findArea } from "@/data/locations";
import { activeAdapter } from "@/lib/pos/adapters";
import type { PosOrder } from "@/lib/pos/types";

const OrderSchema = z.object({
  customer: z.object({
    name: z.string().min(2).max(80),
    phone: z.string().regex(/^(\+92|0)3\d{2}[\s-]?\d{7}$/, "Invalid Pakistani mobile number"),
  }),
  delivery: z.object({
    areaId: z.string(),
    areaName: z.string(),
    block: z.string().min(1).max(60),
    address: z.string().min(8).max(240),
    note: z.string().max(240).optional(),
  }),
  payment: z.enum(["cod", "card"]),
  lines: z
    .array(
      z.object({
        itemId: z.string(),
        variantId: z.string().optional(),
        qty: z.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(30),
});

function orderNumber(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `FOUR-${n}`;
}

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = OrderSchema.safeParse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid order" }, { status: 400 });
  }
  const body = parsed.data;

  // validate area server-side; prices always come from the server menu,
  // never from the client, so totals cannot be tampered with
  const area = findArea(body.delivery.areaId);
  if (!area || !area.blocks.includes(body.delivery.block)) {
    return NextResponse.json({ ok: false, error: "We do not deliver to that area yet" }, { status: 400 });
  }

  const lines: PosOrder["lines"] = [];
  for (const l of body.lines) {
    const item = findItem(l.itemId);
    if (!item) return NextResponse.json({ ok: false, error: `Unknown menu item: ${l.itemId}` }, { status: 400 });
    const variant = l.variantId ? item.variants?.find((v) => v.id === l.variantId) : undefined;
    if (l.variantId && !variant) {
      return NextResponse.json({ ok: false, error: `Unknown size for ${item.name}` }, { status: 400 });
    }
    lines.push({
      itemId: item.id,
      name: item.name,
      variant: variant?.label,
      qty: l.qty,
      unitPrice: variant?.price ?? item.price,
    });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
  const deliveryFee = subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;

  const order: PosOrder = {
    orderNumber: orderNumber(),
    placedAt: new Date().toISOString(),
    customer: body.customer,
    delivery: { ...body.delivery, areaName: area.name },
    payment: body.payment,
    lines,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    source: "web",
  };

  const adapter = activeAdapter();
  const result = await adapter.submitOrder(order);
  if (!result.ok) {
    // POS rejected or unreachable: fail loudly rather than losing an order silently
    console.error(`[orders] POS adapter "${adapter.name}" failed:`, result.error);
    return NextResponse.json(
      { ok: false, error: "We could not reach the kitchen. Please call the restaurant or try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, orderNumber: order.orderNumber, posReference: result.posReference });
}
