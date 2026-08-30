/**
 * Rider operations: PIN login binds the rider to the browser session, the
 * rider app streams GPS over the socket, and every accepted ping fans out
 * to the rider's active order rooms (customer maps) and the admin board.
 * DB writes are throttled; the live stream rides the sockets.
 */
import { prisma, OrderStatus, RiderStatus } from "@four/db";
import { emitToOrder, emitToAdmin } from "../realtime/io.js";

const lastDbWrite = new Map<string, number>();
const DB_WRITE_INTERVAL_MS = 10_000;

export async function loginRider(sessionId: string, phone: string, pin: string) {
  const normalized = phone.replace(/[\s-]/g, "").replace(/^\+92/, "0");
  const rider = await prisma.rider.findUnique({ where: { phone: normalized }, include: { branch: true } });
  if (!rider || !rider.active || rider.pin !== pin) return null;
  await prisma.session.update({ where: { id: sessionId }, data: { riderId: rider.id } });
  await prisma.rider.update({ where: { id: rider.id }, data: { status: RiderStatus.ONLINE, lastSeenAt: new Date() } });
  return rider;
}

export async function logoutRider(sessionId: string, riderId: string) {
  await prisma.session.update({ where: { id: sessionId }, data: { riderId: null } }).catch(() => {});
  await prisma.rider.update({ where: { id: riderId }, data: { status: RiderStatus.OFFLINE } }).catch(() => {});
}

export async function riderProfile(riderId: string) {
  return prisma.rider.findUnique({ where: { id: riderId }, include: { branch: true } });
}

/** The rider's live queue: assigned orders that are out (or ready to go out). */
export async function riderOrders(riderId: string) {
  return prisma.order.findMany({
    where: { riderId, status: { in: [OrderStatus.PREPARING, OrderStatus.OUT_FOR_DELIVERY] } },
    orderBy: { placedAt: "asc" },
    include: { lines: true },
  });
}

export async function activeOrderNumbers(riderId: string): Promise<string[]> {
  const orders = await prisma.order.findMany({
    where: { riderId, status: OrderStatus.OUT_FOR_DELIVERY },
    select: { orderNumber: true },
  });
  return orders.map((o) => o.orderNumber);
}

export async function ingestRiderPosition(riderId: string, lat: number, lng: number, heading: number | null): Promise<void> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return;

  const now = Date.now();
  if ((lastDbWrite.get(riderId) ?? 0) + DB_WRITE_INTERVAL_MS < now) {
    lastDbWrite.set(riderId, now);
    void prisma.rider
      .update({ where: { id: riderId }, data: { lastLat: lat, lastLng: lng, lastSeenAt: new Date() } })
      .catch(() => {});
  }

  const orderNumbers = await activeOrderNumbers(riderId);
  const payload = { riderId, orderNumbers, lat, lng, heading, ts: now };
  for (const num of orderNumbers) emitToOrder(num, "rider:position", payload);
  emitToAdmin("rider:position", payload);
}

export async function listRiders(branchId?: string) {
  return prisma.rider.findMany({
    where: branchId ? { branchId } : undefined,
    include: { branch: true },
    orderBy: { name: "asc" },
  });
}

const PIN_RE = /^\d{4,8}$/;
const PHONE_RE = /^03\d{9}$/;

class RiderAdminError extends Error {
  constructor(
    message: string,
    public code = "RIDER_ADMIN",
  ) {
    super(message);
  }
}

export async function createRider(input: { name: string; phone: string; pin: string; branchId: string }) {
  const phone = input.phone.replace(/[\s-]/g, "").replace(/^\+92/, "0");
  if (!PHONE_RE.test(phone)) throw new RiderAdminError("Rider phone must be a Pakistani mobile, 03xxxxxxxxx", "BAD_PHONE");
  if (!PIN_RE.test(input.pin)) throw new RiderAdminError("PIN must be 4-8 digits", "BAD_PIN");
  const branch = await prisma.branch.findUnique({ where: { id: input.branchId } });
  if (!branch) throw new RiderAdminError("Unknown branch", "BAD_BRANCH");
  const existing = await prisma.rider.findUnique({ where: { phone } });
  if (existing) throw new RiderAdminError("A rider with that phone already exists", "DUPLICATE_PHONE");
  return prisma.rider.create({
    data: { name: input.name.trim(), phone, pin: input.pin, branchId: input.branchId },
    include: { branch: true },
  });
}

export async function updateRider(
  id: string,
  patch: { name?: string; branchId?: string; pin?: string; active?: boolean },
) {
  if (patch.pin !== undefined && !PIN_RE.test(patch.pin)) throw new RiderAdminError("PIN must be 4-8 digits", "BAD_PIN");
  if (patch.branchId) {
    const branch = await prisma.branch.findUnique({ where: { id: patch.branchId } });
    if (!branch) throw new RiderAdminError("Unknown branch", "BAD_BRANCH");
  }
  const rider = await prisma.rider.findUnique({ where: { id } });
  if (!rider) throw new RiderAdminError("Rider not found", "NOT_FOUND");
  const updated = await prisma.rider.update({
    where: { id },
    data: {
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      ...(patch.branchId !== undefined ? { branchId: patch.branchId } : {}),
      ...(patch.pin !== undefined ? { pin: patch.pin } : {}),
      ...(patch.active !== undefined ? { active: patch.active } : {}),
      // a deactivated rider is also knocked offline so they vanish from assignment lists
      ...(patch.active === false ? { status: RiderStatus.OFFLINE } : {}),
    },
    include: { branch: true },
  });
  if (patch.active === false) {
    // and their sessions are unlinked, ending the app login immediately
    await prisma.session.updateMany({ where: { riderId: id }, data: { riderId: null } });
  }
  return updated;
}
