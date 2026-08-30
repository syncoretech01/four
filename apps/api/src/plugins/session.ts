/**
 * Cookie-backed guest sessions (bestbuy pattern, Redis cache dropped for the
 * single-node deployment): every request gets a session row; `id` is the
 * sha256 of the cookie token so a DB leak never exposes usable cookies.
 */
import { createHash, randomBytes } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "@four/db";
import { config, isProd } from "../config.js";

export const SESSION_COOKIE = "four_session";
const SESSION_TTL_DAYS = 30;
const TOUCH_INTERVAL_MS = 60 * 60 * 1000;

export interface SessionContext {
  sessionId: string;
  isAdmin: boolean;
  riderId: string | null;
}

declare module "fastify" {
  interface FastifyRequest {
    session: SessionContext;
  }
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function expiry(): Date {
  return new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export async function createGuestSession(): Promise<{ token: string; sessionId: string }> {
  const token = randomBytes(32).toString("base64url");
  const sessionId = hashToken(token);
  await prisma.session.create({ data: { id: sessionId, expiresAt: expiry() } });
  return { token, sessionId };
}

export function setSessionCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(SESSION_COOKIE, token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: isProd && config.WEB_ORIGIN.startsWith("https"),
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });
}

/** Shared by HTTP requests and the Socket.IO handshake. */
export async function resolveSession(token: string | undefined): Promise<SessionContext | null> {
  if (!token) return null;
  const sessionId = hashToken(token);
  const row = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!row || row.expiresAt < new Date()) return null;
  if (Date.now() - row.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
    prisma.session
      .update({ where: { id: sessionId }, data: { lastSeenAt: new Date(), expiresAt: expiry() } })
      .catch(() => {});
  }
  return { sessionId, isAdmin: row.isAdmin, riderId: row.riderId };
}

export async function sessionPlugin(app: FastifyInstance): Promise<void> {
  app.decorateRequest("session");
  app.addHook("onRequest", async (req: FastifyRequest, reply: FastifyReply) => {
    const token = req.cookies[SESSION_COOKIE];
    let ctx = await resolveSession(token);
    if (!ctx) {
      const { token: newToken, sessionId } = await createGuestSession();
      setSessionCookie(reply, newToken);
      ctx = { sessionId, isAdmin: false, riderId: null };
    }
    req.session = ctx;
  });
}
