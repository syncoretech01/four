import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { OrderStatus } from "@four/db";
import * as riderService from "../services/riderService.js";
import * as orderService from "../services/orderService.js";

export async function riderRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/rider/login",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (req, reply) => {
      const { phone, pin } = z.object({ phone: z.string().min(7).max(20), pin: z.string().min(4).max(12) }).parse(req.body);
      const rider = await riderService.loginRider(req.session.sessionId, phone, pin);
      if (!rider) return reply.code(401).send({ error: { code: "BAD_LOGIN", message: "Wrong phone or PIN" } });
      return { rider: { id: rider.id, name: rider.name, branch: rider.branch.shortName } };
    },
  );

  app.post("/rider/logout", async (req) => {
    if (req.session.riderId) await riderService.logoutRider(req.session.sessionId, req.session.riderId);
    return { ok: true };
  });

  app.get("/rider/me", async (req, reply) => {
    if (!req.session.riderId) return reply.code(401).send({ error: { code: "NOT_RIDER", message: "Sign in first" } });
    const rider = await riderService.riderProfile(req.session.riderId);
    if (!rider) return reply.code(401).send({ error: { code: "NOT_RIDER", message: "Sign in first" } });
    const orders = await riderService.riderOrders(rider.id);
    return {
      rider: { id: rider.id, name: rider.name, branch: rider.branch.shortName },
      orders: orders.map((o) => ({
        orderNumber: o.orderNumber,
        status: o.status,
        customerName: o.customerName,
        phone: o.phone,
        address: o.address,
        block: o.block,
        areaName: o.areaName,
        note: o.note,
        payment: o.payment,
        total: o.total,
        destLat: o.destLat,
        destLng: o.destLng,
        lines: o.lines.map((l) => ({ name: l.name, variantLabel: l.variantLabel, qty: l.qty })),
      })),
    };
  });

  /** Rider marks an assigned order delivered from the doorstep. */
  app.post("/rider/orders/:orderNumber/delivered", async (req, reply) => {
    if (!req.session.riderId) return reply.code(401).send({ error: { code: "NOT_RIDER", message: "Sign in first" } });
    const { orderNumber } = req.params as { orderNumber: string };
    const order = await orderService.getOrder(orderNumber.toUpperCase());
    if (!order) return reply.code(404).send({ error: { code: "NOT_FOUND", message: "Order not found" } });
    const mine = (await riderService.riderOrders(req.session.riderId)).some((o) => o.orderNumber === order.orderNumber);
    if (!mine) return reply.code(403).send({ error: { code: "NOT_YOURS", message: "Not your order" } });
    return { order: await orderService.updateStatus(order.orderNumber, OrderStatus.DELIVERED) };
  });
}
