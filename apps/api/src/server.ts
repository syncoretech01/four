import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { ZodError } from "zod";
import { config, isProd } from "./config.js";
import { sessionPlugin } from "./plugins/session.js";
import { initIO } from "./realtime/io.js";
import { menuRoutes } from "./routes/menu.js";
import { cartRoutes } from "./routes/cart.js";
import { orderRoutes } from "./routes/orders.js";
import { chatRoutes } from "./routes/chat.js";
import { adminRoutes } from "./routes/admin.js";

async function main(): Promise<void> {
  const app = Fastify({
    logger: isProd ? true : { transport: { target: "pino-pretty" } },
    trustProxy: true,
  });

  await app.register(cors, {
    origin: config.WEB_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  });
  await app.register(cookie);
  await app.register(rateLimit, { max: 300, timeWindow: "1 minute" });
  // applied on the root scope (not register()) so the hook covers every route
  await sessionPlugin(app);

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof ZodError) {
      return reply.code(400).send({
        error: { code: "VALIDATION", message: err.issues[0]?.message ?? "Invalid input" },
      });
    }
    const anyErr = err as Error & { code?: string; statusCode?: number };
    if (anyErr.code && typeof anyErr.code === "string" && anyErr.code === anyErr.code.toUpperCase() && anyErr.code.length < 24) {
      const status =
        anyErr.code === "NOT_FOUND" ? 404 : anyErr.code === "POS_DOWN" ? 502 : anyErr.code === "FORBIDDEN" ? 403 : 400;
      return reply.code(status).send({ error: { code: anyErr.code, message: anyErr.message } });
    }
    app.log.error(err);
    return reply.code(anyErr.statusCode ?? 500).send({ error: { code: "INTERNAL", message: "Something went wrong" } });
  });

  app.get("/health", async () => ({ ok: true }));

  await app.register(menuRoutes, { prefix: "/api" });
  await app.register(cartRoutes, { prefix: "/api" });
  await app.register(orderRoutes, { prefix: "/api" });
  await app.register(chatRoutes, { prefix: "/api" });
  await app.register(adminRoutes, { prefix: "/api" });

  await app.ready();
  initIO(app.server);

  await app.listen({ port: config.PORT, host: "0.0.0.0" });
  app.log.info(`FOUR api on :${config.PORT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
