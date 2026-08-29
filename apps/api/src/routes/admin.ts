import { timingSafeEqual } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, OrderStatus } from "@four/db";
import { config } from "../config.js";
import * as orderService from "../services/orderService.js";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/admin/login",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (req, reply) => {
      const { password } = z.object({ password: z.string().min(1).max(200) }).parse(req.body);
      if (!safeEqual(password, config.ADMIN_PASSWORD)) {
        return reply.code(401).send({ error: { code: "BAD_PASSWORD", message: "Wrong password" } });
      }
      await prisma.session.update({ where: { id: req.session.sessionId }, data: { isAdmin: true } });
      return { ok: true };
    },
  );

  app.post("/admin/logout", async (req) => {
    await prisma.session.update({ where: { id: req.session.sessionId }, data: { isAdmin: false } });
    return { ok: true };
  });

  app.addHook("preHandler", async (req, reply) => {
    // login/logout above register before this hook is added, so everything
    // below requires an admin session
    if (!req.session.isAdmin && !req.url.endsWith("/admin/login")) {
      return reply.code(403).send({ error: { code: "FORBIDDEN", message: "Admin only" } });
    }
  });

  app.get("/admin/orders", async () => {
    const orders = await orderService.listOrders(80);
    return {
      orders: orders.map((o) => ({
        orderNumber: o.orderNumber,
        status: o.status,
        placedAt: o.placedAt.toISOString(),
        customerName: o.customerName,
        phone: o.phone,
        areaName: o.areaName,
        block: o.block,
        address: o.address,
        note: o.note,
        payment: o.payment,
        total: o.total,
        lines: o.lines.map((l) => ({
          name: l.name,
          variantLabel: l.variantLabel,
          modifiers: (l.modifiers as string[]) ?? [],
          qty: l.qty,
        })),
      })),
    };
  });

  app.patch("/admin/orders/:orderNumber/status", async (req) => {
    const { orderNumber } = req.params as { orderNumber: string };
    const { status } = z.object({ status: z.nativeEnum(OrderStatus) }).parse(req.body);
    return { order: await orderService.updateStatus(orderNumber.toUpperCase(), status) };
  });

  app.patch("/admin/items/:itemId/availability", async (req) => {
    const { itemId } = req.params as { itemId: string };
    const { available } = z.object({ available: z.boolean() }).parse(req.body);
    const item = await prisma.menuItem.update({ where: { id: itemId }, data: { available } });
    return { item: { id: item.id, available: item.available } };
  });
}
