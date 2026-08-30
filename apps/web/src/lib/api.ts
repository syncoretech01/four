export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
  ) {
    super(message);
  }
}

let bootstrap: Promise<void> | null = null;

/**
 * The API mints the session cookie on the first request. If several
 * cookieless requests race on a first visit, the server creates a session
 * per request and the last Set-Cookie wins - splitting the cart between
 * subsystems. So every call (and the socket handshake) waits for one
 * bootstrap request to establish the cookie first.
 */
export function ensureSession(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  bootstrap ??= fetch(`${API_URL}/api/cart`, { credentials: "include" })
    .then(() => undefined)
    .catch(() => {
      bootstrap = null; // let a later call retry
    });
  return bootstrap;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  await ensureSession();
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    // only claim JSON when a body is actually sent - Fastify rejects
    // empty bodies that carry a JSON content-type
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  const body = (await res.json().catch(() => ({}))) as T & { error?: { code: string; message: string } };
  if (!res.ok) {
    throw new ApiError(body.error?.message ?? "Request failed", body.error?.code ?? "UNKNOWN", res.status);
  }
  return body;
}
