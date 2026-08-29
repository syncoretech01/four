import type { FastifyInstance } from "fastify";
import { cartAddSchema, cartUpdateSchema } from "@four/shared";
import * as cartService from "../services/cartService.js";

export async function cartRoutes(app: FastifyInstance): Promise<void> {
  app.get("/cart", async (req) => cartService.viewCart(req.session.sessionId));

  app.post("/cart/lines", async (req) => {
    const input = cartAddSchema.parse(req.body);
    return cartService.addToCart(req.session.sessionId, input);
  });

  app.patch("/cart/lines", async (req) => {
    const { lineId, qty } = cartUpdateSchema.parse(req.body);
    return cartService.setLineQty(req.session.sessionId, lineId, qty);
  });

  app.delete("/cart", async (req) => cartService.clearCart(req.session.sessionId));
}
