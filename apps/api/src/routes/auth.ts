import type { FastifyInstance } from "fastify";
import { z } from "zod";
import * as authService from "../services/authService.js";

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/auth/request-code",
    { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } },
    async (req) => {
      const { phone } = z.object({ phone: z.string().min(7).max(20) }).parse(req.body);
      return authService.requestCode(phone);
    },
  );

  app.post(
    "/auth/verify-code",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (req) => {
      const { phone, code } = z
        .object({ phone: z.string().min(7).max(20), code: z.string().regex(/^\d{6}$/, "The code is 6 digits") })
        .parse(req.body);
      return { customer: await authService.verifyCode(req.session.sessionId, phone, code) };
    },
  );

  app.get("/auth/me", async (req) => {
    return { customer: await authService.currentCustomer(req.session.sessionId) };
  });

  app.post("/auth/logout", async (req) => {
    await authService.signOut(req.session.sessionId);
    return { ok: true };
  });
}
