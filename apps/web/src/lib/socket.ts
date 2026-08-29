"use client";

import { io, type Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "@four/shared";
import { SOCKET_PATH } from "@four/shared";
import { API_URL, ensureSession } from "./api";

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

export function getSocket(): AppSocket {
  if (!socket) {
    socket = io(API_URL, { path: SOCKET_PATH, withCredentials: true, autoConnect: false });
    // handy for debugging in the browser console
    (window as unknown as { __fourSocket?: AppSocket }).__fourSocket = socket;
    void ensureSession().then(() => socket!.connect());
  }
  return socket;
}
