/**
 * Cross-device customer sign-in with one-time codes.
 *
 * Order history is normally tied to the browser session that placed the
 * orders. To see it on another device the customer proves they own the phone
 * number: we send a 6-digit code (over the notify bridge - WhatsApp once
 * configured, console in dev), they type it back, and the session is linked
 * to the customer record. Codes are HMAC-hashed at rest, single-use, expire
 * in 5 minutes, and tolerate 5 wrong guesses before burning.
 */
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { prisma } from "@four/db";
import { config, isProd } from "../config.js";
import { sendLoginCode } from "../notify/notifyService.js";

const CODE_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_GUESSES = 5;

class AuthError extends Error {
  constructor(
    message: string,
    public code = "AUTH_ERROR",
  ) {
    super(message);
  }
}

function hashCode(phone: string, code: string): string {
  return createHmac("sha256", config.APP_SECRET).update(`${phone}:${code}`).digest("base64url");
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits.startsWith("+92") ? `0${digits.slice(3)}` : digits;
}

export async function requestCode(phoneRaw: string): Promise<{ ok: true; devCode?: string }> {
  const phone = normalizePhone(phoneRaw);
  if (!/^03\d{9}$/.test(phone)) throw new AuthError("Enter a valid Pakistani mobile number", "BAD_PHONE");

  const existing = await prisma.loginCode.findUnique({ where: { phone } });
  if (existing && existing.createdAt.getTime() + RESEND_COOLDOWN_MS > Date.now()) {
    throw new AuthError("A code was just sent - wait a moment before requesting another", "TOO_SOON");
  }

  const code = String(randomInt(100000, 1000000));
  await prisma.loginCode.upsert({
    where: { phone },
    create: { phone, codeHash: hashCode(phone, code), expiresAt: new Date(Date.now() + CODE_TTL_MS) },
    update: { codeHash: hashCode(phone, code), expiresAt: new Date(Date.now() + CODE_TTL_MS), attempts: 0, createdAt: new Date() },
  });

  await sendLoginCode(phone, code);
  // in dev/test the console adapter only logs, so hand the code back for convenience
  return isProd ? { ok: true } : { ok: true, devCode: code };
}

export async function verifyCode(sessionId: string, phoneRaw: string, code: string) {
  const phone = normalizePhone(phoneRaw);
  const row = await prisma.loginCode.findUnique({ where: { phone } });
  if (!row || row.expiresAt < new Date()) {
    throw new AuthError("Code expired - request a new one", "CODE_EXPIRED");
  }
  if (row.attempts >= MAX_GUESSES) {
    await prisma.loginCode.delete({ where: { phone } }).catch(() => {});
    throw new AuthError("Too many wrong codes - request a new one", "TOO_MANY_GUESSES");
  }

  const expected = Buffer.from(row.codeHash);
  const got = Buffer.from(hashCode(phone, code));
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) {
    await prisma.loginCode.update({ where: { phone }, data: { attempts: { increment: 1 } } });
    throw new AuthError("Wrong code", "BAD_CODE");
  }

  await prisma.loginCode.delete({ where: { phone } });
  // first sign-in from a device that never ordered still gets an account
  const customer = await prisma.customer.upsert({
    where: { phone },
    create: { phone, name: "FOUR customer" },
    update: {},
  });
  await prisma.session.update({ where: { id: sessionId }, data: { customerId: customer.id } });
  return { id: customer.id, name: customer.name, phone: customer.phone };
}

export async function currentCustomer(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { customer: { select: { id: true, name: true, phone: true } } },
  });
  return session?.customer ?? null;
}

export async function signOut(sessionId: string): Promise<void> {
  await prisma.session.update({ where: { id: sessionId }, data: { customerId: null } }).catch(() => {});
}
