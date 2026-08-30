import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { config } from "../config.js";
import * as orderService from "../services/orderService.js";

export async function paymentRoutes(app: FastifyInstance): Promise<void> {
  /**
   * Demo gateway confirm: hit by the built-in /pay/<order> page. The HMAC
   * token minted at order time is the proof of a legitimate flow - a real
   * gateway's webhook signature check replaces this.
   */
  app.post(
    "/payments/demo/confirm",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (req, reply) => {
      if (config.PAYMENT_PROVIDER !== "demo") {
        return reply.code(400).send({ error: { code: "WRONG_PROVIDER", message: "Demo payments are not enabled" } });
      }
      const { orderNumber, token } = z
        .object({ orderNumber: z.string().min(4).max(20), token: z.string().min(10) })
        .parse(req.body);
      const num = orderNumber.toUpperCase();
      if (!orderService.validDemoPayToken(num, token)) {
        return reply.code(403).send({ error: { code: "BAD_TOKEN", message: "Invalid payment token" } });
      }
      return { order: await orderService.confirmPayment(num) };
    },
  );

  /**
   * Real gateway webhooks land here. Each case verifies the provider's own
   * signature before confirming - filled in when FOUR's merchant account
   * exists (see payments/providers.ts for what each needs).
   */
  app.post("/payments/webhook/:provider", async (req, reply) => {
    const { provider } = req.params as { provider: string };
    if (provider !== config.PAYMENT_PROVIDER) {
      return reply.code(400).send({ error: { code: "WRONG_PROVIDER", message: "Provider not active" } });
    }
    return reply
      .code(501)
      .send({ error: { code: "NOT_IMPLEMENTED", message: `${provider} webhook verification not implemented yet` } });
  });
}
