/**
 * Socket.IO server: cookie-authenticated; rooms per session (cart + chat),
 * per order (tracking page), and one admin room (order board). Services
 * import the emit helpers so REST- and bot-driven mutations broadcast the
 * same events.
 */
import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import type { ServerToClientEvents, ClientToServerEvents } from "@four/shared";
import { SOCKET_PATH } from "@four/shared";
import { config } from "../config.js";
import { resolveSession, SESSION_COOKIE } from "../plugins/session.js";
import { handleChatMessage } from "../chat/chatService.js";
import { ingestRiderPosition } from "../services/riderService.js";
import { sessionCanViewOrder } from "../services/orderService.js";

type IO = Server<ClientToServerEvents, ServerToClientEvents>;

let io: IO | null = null;

function parseCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

export function initIO(server: HttpServer): IO {
  io = new Server(server, {
    path: SOCKET_PATH,
    cors: { origin: config.WEB_ORIGIN, credentials: true },
  });

  io.use(async (socket, next) => {
    const token = parseCookie(socket.handshake.headers.cookie, SESSION_COOKIE);
    const session = await resolveSession(token);
    if (!session) return next(new Error("no session"));
    socket.data.sessionId = session.sessionId;
    socket.data.isAdmin = session.isAdmin;
    socket.data.riderId = session.riderId;
    next();
  });

  io.on("connection", (socket) => {
    const sessionId = socket.data.sessionId as string;
    void socket.join(`session:${sessionId}`);

    socket.on("order:watch", ({ orderNumber }) => {
      // the order room streams live rider GPS + status, so only the order's
      // owner (or staff/assigned rider) may join it - not anyone who guesses
      // an order number
      if (typeof orderNumber !== "string" || !/^FOUR-\d{6}$/.test(orderNumber)) return;
      void sessionCanViewOrder(
        { sessionId, isAdmin: socket.data.isAdmin as boolean, riderId: (socket.data.riderId as string | null) ?? null },
        orderNumber,
      ).then((ok) => {
        if (ok) void socket.join(`order:${orderNumber}`);
      });
    });

    socket.on("admin:watch", () => {
      if (socket.data.isAdmin) void socket.join("admin");
    });

    socket.on("rider:position", (payload) => {
      const riderId = socket.data.riderId as string | null;
      if (!riderId || typeof payload?.lat !== "number" || typeof payload?.lng !== "number") return;
      void ingestRiderPosition(riderId, payload.lat, payload.lng, payload.heading ?? null);
    });

    socket.on("chat:send", (payload, ack) => {
      const message = typeof payload?.message === "string" ? payload.message.trim() : "";
      if (!message || message.length > 600) {
        ack?.(false);
        return;
      }
      ack?.(true);
      void handleChatMessage(
        { sessionId, isAdmin: socket.data.isAdmin as boolean, riderId: (socket.data.riderId as string | null) ?? null },
        message,
      );
    });
  });

  return io;
}

export function emitToSession<E extends keyof ServerToClientEvents>(
  sessionId: string,
  event: E,
  ...args: Parameters<ServerToClientEvents[E]>
): void {
  (io?.to(`session:${sessionId}`) as { emit: (e: E, ...a: Parameters<ServerToClientEvents[E]>) => void } | undefined)?.emit(event, ...args);
}

export function emitToOrder<E extends keyof ServerToClientEvents>(
  orderNumber: string,
  event: E,
  ...args: Parameters<ServerToClientEvents[E]>
): void {
  (io?.to(`order:${orderNumber}`) as { emit: (e: E, ...a: Parameters<ServerToClientEvents[E]>) => void } | undefined)?.emit(event, ...args);
}

export function emitToAdmin<E extends keyof ServerToClientEvents>(
  event: E,
  ...args: Parameters<ServerToClientEvents[E]>
): void {
  (io?.to("admin") as { emit: (e: E, ...a: Parameters<ServerToClientEvents[E]>) => void } | undefined)?.emit(event, ...args);
}
