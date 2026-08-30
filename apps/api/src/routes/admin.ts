import { timingSafeEqual } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, OrderStatus } from "@four/db";
import { config } from "../config.js";
import * as orderService from "../services/orderService.js";
import * as riderService from "../services/riderService.js";
import { demoPosFeed } from "../pos/adapters.js";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/**
 * The console credential is a 4-8 digit PIN so kitchen staff can enter it on a
 * tablet numpad. Four digits is 10,000 combinations, which a per-IP rate limit
 * alone does not protect - an attacker rotating IPs would walk the whole space.
 * So failures are also counted globally against the single shared PIN, and the
 * login is locked for everyone once they pile up.
 *
 * In-memory, which suits the single-node deployment. A restart clears it; that
 * is acceptable because an attacker cannot force one.
 */
const LOCKOUT_AFTER = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
let failedAttempts = 0;
let lockedUntil = 0;

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/admin/login",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (req, reply) => {
      const { pin } = z.object({ pin: z.string().min(1).max(16) }).parse(req.body);

      const now = Date.now();
      if (now < lockedUntil) {
        const minutes = Math.ceil((lockedUntil - now) / 60_000);
        return reply.code(429).send({
          error: {
            code: "LOCKED_OUT",
            message: `Too many wrong PINs. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
          },
        });
      }

      if (!safeEqual(pin, config.ADMIN_PIN)) {
        failedAttempts += 1;
        if (failedAttempts >= LOCKOUT_AFTER) {
          lockedUntil = now + LOCKOUT_MS;
          failedAttempts = 0;
          req.log.warn("admin login locked out after repeated wrong PINs");
        }
        return reply.code(401).send({ error: { code: "BAD_PIN", message: "Wrong PIN" } });
      }

      failedAttempts = 0;
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

  app.get("/admin/branches", async () => {
    const branches = await prisma.branch.findMany({ orderBy: { name: "asc" } });
    return { branches: branches.map((b) => ({ id: b.id, name: b.name, shortName: b.shortName })) };
  });

  app.get("/admin/riders", async (req) => {
    const { branchId } = req.query as { branchId?: string };
    const riders = await riderService.listRiders(branchId || undefined);
    return {
      riders: riders.map((r) => ({
        id: r.id,
        name: r.name,
        phone: r.phone,
        status: r.status,
        active: r.active,
        branchId: r.branchId,
        branch: r.branch.shortName,
        lastLat: r.lastLat,
        lastLng: r.lastLng,
        lastSeenAt: r.lastSeenAt?.toISOString() ?? null,
      })),
    };
  });

  app.post("/admin/riders", async (req) => {
    const input = z
      .object({
        name: z.string().trim().min(2).max(60),
        phone: z.string().min(7).max(20),
        pin: z.string().min(4).max(8),
        branchId: z.string().min(1),
      })
      .parse(req.body);
    const r = await riderService.createRider(input);
    return { rider: { id: r.id, name: r.name, phone: r.phone, branchId: r.branchId, branch: r.branch.shortName, active: r.active, status: r.status } };
  });

  app.patch("/admin/riders/:riderId", async (req) => {
    const { riderId } = req.params as { riderId: string };
    const patch = z
      .object({
        name: z.string().trim().min(2).max(60).optional(),
        branchId: z.string().min(1).optional(),
        pin: z.string().min(4).max(8).optional(),
        active: z.boolean().optional(),
      })
      .parse(req.body);
    const r = await riderService.updateRider(riderId, patch);
    return { rider: { id: r.id, name: r.name, phone: r.phone, branchId: r.branchId, branch: r.branch.shortName, active: r.active, status: r.status } };
  });

  app.patch("/admin/orders/:orderNumber/rider", async (req) => {
    const { orderNumber } = req.params as { orderNumber: string };
    const { riderId } = z.object({ riderId: z.string().nullable() }).parse(req.body);
    return { order: await orderService.assignRider(orderNumber.toUpperCase(), riderId) };
  });

  app.get("/admin/orders", async (req) => {
    const { branchId } = req.query as { branchId?: string };
    const orders = await orderService.listOrders(80, branchId || undefined);
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
        branchId: o.branchId,
        branch: o.branch?.shortName ?? null,
        riderId: o.riderId,
        riderName: o.rider?.name ?? null,
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

  /**
   * What the POS bridge actually sent, newest first. Populated only by the
   * `demo` provider - it exists to show a POS vendor the exact payload their
   * endpoint would receive.
   */
  app.get("/admin/pos-feed", async () => ({ provider: config.POS_PROVIDER, entries: demoPosFeed() }));

  app.patch("/admin/items/:itemId/availability", async (req) => {
    const { itemId } = req.params as { itemId: string };
    const { available } = z.object({ available: z.boolean() }).parse(req.body);
    const item = await prisma.menuItem.update({ where: { id: itemId }, data: { available } });
    return { item: { id: item.id, available: item.available } };
  });
}
