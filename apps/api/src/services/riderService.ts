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
  if (!rider || rider.pin !== pin) return null;
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
