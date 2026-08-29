import type { CartView } from "./schemas.js";

/** Socket.IO event contracts shared by api and web. */

export interface ServerToClientEvents {
  "cart:updated": (cart: CartView) => void;
  "order:status": (payload: { orderNumber: string; status: string; at: string }) => void;
  "admin:order:new": (payload: { orderNumber: string }) => void;
  "admin:order:updated": (payload: { orderNumber: string; status: string }) => void;
  "chat:delta": (payload: { messageId: string; delta: string }) => void;
  "chat:tool": (payload: { messageId: string; name: string; label: string; state: "running" | "done" | "error" }) => void;
  "chat:done": (payload: {
    messageId: string;
    content: string;
    navigateTo: string | null;
    confirmAction: unknown | null;
  }) => void;
}

export interface ClientToServerEvents {
  "chat:send": (payload: { message: string }, ack?: (ok: boolean) => void) => void;
  "order:watch": (payload: { orderNumber: string }) => void;
  "admin:watch": () => void;
}

export const SOCKET_PATH = "/socket.io";
