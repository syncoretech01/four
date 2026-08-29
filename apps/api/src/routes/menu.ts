import type { FastifyInstance } from "fastify";
import { LAHORE_AREAS } from "@four/shared";
import * as menuService from "../services/menuService.js";

export async function menuRoutes(app: FastifyInstance): Promise<void> {
  app.get("/menu", async () => ({ categories: await menuService.fullMenu() }));

  app.get("/menu/search", async (req) => {
    const { q = "", limit = "6" } = req.query as { q?: string; limit?: string };
    return { items: await menuService.searchItems(q, Math.min(12, Number(limit) || 6)) };
  });

  app.get("/areas", async () => ({ areas: LAHORE_AREAS }));
}
