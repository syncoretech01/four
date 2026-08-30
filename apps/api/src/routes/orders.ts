import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { checkoutSchema } from "@four/shared";
import * as orderService from "../services/orderService.js";

export async function orderRoutes(app: FastifyInstance): Promise<void> {
  app.post("/orders/quote", async (req) => {
    const { payment } = z.object({ payment: z.enum(["COD", "CARD"]).default("COD") }).parse(req.body ?? {});
    return orderService.quote(req.session.sessionId, payment);
  });

  app.post(
    "/orders",
    { config: { rateLimit: { max: 8, timeWindow: "1 minute" } } },
    async (req) => {
      const input = checkoutSchema.parse(req.body);
      return orderService.placeOrder(req.session.sessionId, input);
    },
  );

  app.get("/orders/mine", async (req) => {
    return { orders: await orderService.ordersForSession(req.session.sessionId) };
  });

  app.get("/orders/latest", async (req) => {
    const order = await orderService.latestOrderForSession(req.session.sessionId);
    return { order };
  });

  app.get("/orders/:orderNumber", async (req, reply) => {
    const { orderNumber } = req.params as { orderNumber: string };
    const num = orderNumber.toUpperCase();
    // order numbers are short and enumerable, so a bare lookup would leak
    // every customer's name/phone/address; only the owner (or staff) may read one
    if (!(await orderService.sessionCanViewOrder(req.session, num))) {
      return reply.code(404).send({ error: { code: "NOT_FOUND", message: "Order not found" } });
    }
    const order = await orderService.getOrder(num);
    if (!order) return reply.code(404).send({ error: { code: "NOT_FOUND", message: "Order not found" } });
    return { order };
  });
}
