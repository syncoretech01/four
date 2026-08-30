"use client";

/**
 * Rider app (mobile-first web): PIN login, live delivery queue, and a GPS
 * toggle that streams the phone's position over the socket - customers'
 * tracking maps and the admin board follow the dot in real time.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { formatPKR } from "@four/shared";
import { api, ApiError } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { BrandLogo } from "@/components/BrandLogo";

interface RiderOrder {
  orderNumber: string;
  status: string;
  customerName: string;
  phone: string;
  address: string;
  block: string;
  areaName: string;
  note: string | null;
  payment: "COD" | "CARD";
  total: number;
  lines: { name: string; variantLabel: string | null; qty: number }[];
}

interface RiderMe {
  rider: { id: string; name: string; branch: string };
  orders: RiderOrder[];
}

export default function RiderPage() {
  const [me, setMe] = useState<RiderMe | null>(null);
  const [checked, setChecked] = useState(false);
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [lastFix, setLastFix] = useState<string>("");
  const watchIdRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      setMe(await api<RiderMe>("/api/rider/me"));
    } catch {
      setMe(null);
    } finally {
      setChecked(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 20000);
    return () => clearInterval(t);
  }, [refresh]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api("/api/rider/login", { method: "POST", body: JSON.stringify({ phone, pin }) });
      getSocket().disconnect().connect(); // refresh socket auth with the rider flag
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    }
  };

  const stopStreaming = useCallback(() => {
    if (watchIdRef.current != null) navigator.geolocation?.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    setStreaming(false);
  }, []);

  const startStreaming = () => {
    if (!navigator.geolocation) {
      setError("This device has no GPS access. Use a phone over https.");
      return;
    }
    setError("");
    const socket = getSocket();
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        socket.emit("rider:position", {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          heading: pos.coords.heading,
        });
        setLastFix(new Date().toLocaleTimeString());
      },
      () => setError("Location permission denied - enable it to go live."),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 },
    );
    setStreaming(true);
  };

  useEffect(() => () => stopStreaming(), [stopStreaming]);

  const delivered = async (orderNumber: string) => {
    await api(`/api/rider/orders/${orderNumber}/delivered`, { method: "POST" }).catch(() => {});
    await refresh();
  };

  const logout = async () => {
    stopStreaming();
    await api("/api/rider/logout", { method: "POST" }).catch(() => {});
    getSocket().disconnect().connect();
    setMe(null);
  };

  if (!checked) return <main className="flex min-h-[100dvh] items-center justify-center text-ink-soft">Loading...</main>;

  if (!me) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center px-4">
        <form onSubmit={login} className="w-full max-w-sm rounded-card bg-cream p-8 shadow-xl shadow-ink/10">
          <span className="text-red">
            <BrandLogo className="h-8" />
          </span>
          <h1 className="font-display mt-4 text-2xl font-semibold text-ink">Rider app</h1>
          <label className="mt-6 grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink">Phone</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              placeholder="0300 0000001"
              className="h-12 rounded-xl border border-ink/15 bg-cream px-4 text-ink outline-none focus:border-red focus:ring-2 focus:ring-red/30"
            />
          </label>
          <label className="mt-4 grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink">PIN</span>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              inputMode="numeric"
              className="h-12 rounded-xl border border-ink/15 bg-cream px-4 text-ink outline-none focus:border-red focus:ring-2 focus:ring-red/30"
            />
          </label>
          {error && <p className="mt-3 text-sm font-medium text-red">{error}</p>}
          <button className="mt-5 w-full rounded-full bg-red py-3.5 font-semibold text-cream transition hover:bg-red-deep">
            Sign in
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[100dvh] max-w-lg px-4 py-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-red">
            <BrandLogo className="h-6" />
          </span>
          <div>
            <p className="font-display text-lg font-semibold leading-tight text-ink">{me.rider.name}</p>
            <p className="text-xs text-ink-soft">{me.rider.branch} branch</p>
          </div>
        </div>
        <button onClick={logout} className="text-sm font-medium text-ink-soft underline-offset-4 hover:underline">
          Sign out
        </button>
      </header>

      <button
        onClick={streaming ? stopStreaming : startStreaming}
        className={`mt-6 w-full rounded-card p-5 text-left transition ${
          streaming ? "bg-red text-cream" : "bg-cream text-ink"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-lg font-semibold">{streaming ? "You're live" : "Go live"}</p>
            <p className={`text-sm ${streaming ? "text-cream/80" : "text-ink-soft"}`}>
              {streaming
                ? `Streaming GPS${lastFix ? ` - last fix ${lastFix}` : ""}. Tap to stop.`
                : "Tap to start streaming your location to customers and the kitchen."}
            </p>
          </div>
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
              streaming ? "bg-cream text-red" : "bg-beige-deep text-ink"
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11Z" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="10" r="2.5" fill="currentColor" />
            </svg>
          </span>
        </div>
      </button>

      {error && <p className="mt-3 text-sm font-medium text-red">{error}</p>}

      <h2 className="font-display mt-8 text-xl font-semibold text-ink">Your deliveries</h2>
      <div className="mt-3 grid gap-3">
        {me.orders.length === 0 && (
          <p className="rounded-card bg-cream p-6 text-center text-sm text-ink-soft">
            Nothing assigned right now. New deliveries appear here.
          </p>
        )}
        {me.orders.map((o) => (
          <article key={o.orderNumber} className="rounded-card bg-cream p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-ink">{o.orderNumber}</h3>
              <span className="rounded-full bg-red px-3 py-1 text-xs font-bold text-cream">
                {o.status === "OUT_FOR_DELIVERY" ? "On the way" : "In the kitchen"}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-ink">
              {o.customerName} · <a href={`tel:${o.phone}`} className="text-red underline-offset-2 hover:underline">{o.phone}</a>
            </p>
            <p className="text-sm text-ink-soft">
              {o.address}, {o.block}, {o.areaName}
              {o.note ? ` · "${o.note}"` : ""}
            </p>
            <ul className="mt-2 text-sm text-ink-soft">
              {o.lines.map((l, i) => (
                <li key={i}>
                  {l.qty}x {l.name}
                  {l.variantLabel ? ` (${l.variantLabel})` : ""}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-bold text-ink">
                {formatPKR(o.total)} <span className="text-xs font-medium text-ink-soft">{o.payment === "COD" ? "collect cash" : "card"}</span>
              </span>
              {o.status === "OUT_FOR_DELIVERY" && (
                <button
                  onClick={() => delivered(o.orderNumber)}
                  className="rounded-full bg-red px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-red-deep active:scale-[0.98]"
                >
                  Mark delivered
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
