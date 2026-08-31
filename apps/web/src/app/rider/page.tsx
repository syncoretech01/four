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
        <form onSubmit={login} className="w-full max-w-sm rounded-card bg-cream p-8 border-2 border-ink-900 [box-shadow:var(--shadow-pop-lg)]">
          <span className="text-red">
            <BrandLogo className="h-8" />
          </span>
          <h1 className="font-display mt-4 text-3xl font-bold tracking-tight text-ink">Rider app</h1>
          <p className="mt-1 text-sm text-ink-soft">Sign in to see your deliveries and go live.</p>
          <label className="mt-6 grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink">Phone</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              placeholder="0300 0000001"
              className="h-12 rounded-xl border-2 border-ink-900/25 bg-cream px-4 text-ink outline-none focus:border-red focus:ring-2 focus:ring-red/30"
            />
          </label>
          <label className="mt-4 grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink">PIN</span>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              inputMode="numeric"
              className="h-12 rounded-xl border-2 border-ink-900/25 bg-cream px-4 text-ink outline-none focus:border-red focus:ring-2 focus:ring-red/30"
            />
          </label>
          {error && <p className="mt-3 text-sm font-medium text-red">{error}</p>}
          <button className="mt-5 w-full rounded-full bg-red py-3.5 font-bold text-cream transition hover:bg-red-deep active:scale-[0.98] border-2 border-ink-900 [box-shadow:var(--shadow-pop)]">
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
            <p className="font-display text-lg font-bold leading-tight text-ink">{me.rider.name}</p>
            <p className="text-xs text-ink-soft">{me.rider.branch} branch</p>
          </div>
        </div>
        <button onClick={logout} className="text-sm font-medium text-ink-soft underline-offset-4 hover:underline">
          Sign out
        </button>
      </header>

      <button
        onClick={streaming ? stopStreaming : startStreaming}
        className={`mt-6 w-full rounded-card p-5 text-left shadow-lg transition active:scale-[0.99] ${
          streaming ? "bg-red text-cream shadow-red/25" : "bg-cream text-ink shadow-ink/5"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display flex items-center gap-2 text-xl font-bold">
              {streaming && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-cream opacity-60 motion-safe:animate-ping border-2 border-red-press [box-shadow:var(--shadow-pop-red)]" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cream border-2 border-red-press [box-shadow:var(--shadow-pop-red)]" />
                </span>
              )}
              {streaming ? "You're live" : "Go live"}
            </p>
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

      <div className="mt-8 flex items-baseline justify-between">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink">Your deliveries</h2>
        {me.orders.length > 0 && (
          <span className="rounded-full bg-red px-3 py-1 text-xs font-bold text-cream border-2 border-ink-900 [box-shadow:var(--shadow-pop)]">{me.orders.length} active</span>
        )}
      </div>
      <div className="mt-3 grid gap-3">
        {me.orders.length === 0 && (
          <p className="rounded-card bg-cream p-8 text-center text-sm font-medium text-ink-soft border-2 border-ink-900 [box-shadow:var(--shadow-pop-lg)]">
            Nothing assigned right now. New deliveries appear here.
          </p>
        )}
        {me.orders.map((o) => {
          const out = o.status === "OUT_FOR_DELIVERY";
          const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${o.address}, ${o.block}, ${o.areaName}, Lahore`)}`;
          return (
            <article key={o.orderNumber} className="overflow-hidden rounded-card bg-cream border-2 border-ink-900 [box-shadow:var(--shadow-pop-lg)]">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-bold text-ink">{o.orderNumber}</h3>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${out ? "bg-red text-cream" : "bg-beige-deep text-ink"}`}
                  >
                    {out ? "On the way" : "In the kitchen"}
                  </span>
                </div>
                <p className="mt-3 font-bold text-ink">{o.customerName}</p>
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

                {/* what the rider must not get wrong: how much cash to collect */}
                <div
                  className={`mt-4 rounded-xl px-4 py-3 text-center font-bold ${
                    o.payment === "COD" ? "bg-red/10 text-red" : "bg-beige-deep text-ink"
                  }`}
                >
                  {o.payment === "COD" ? `Collect ${formatPKR(o.total)} cash` : `${formatPKR(o.total)} · paid by card`}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <a
                    href={`tel:${o.phone}`}
                    className="flex items-center justify-center gap-2 rounded-full border-2 border-ink-900/25 py-3 text-sm font-bold text-ink transition hover:border-ink active:scale-[0.98]"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M4 4h4l2 5-3 2a12 12 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 2 6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                    </svg>
                    Call
                  </a>
                  <a
                    href={mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-full border-2 border-ink-900/25 py-3 text-sm font-bold text-ink transition hover:border-ink active:scale-[0.98]"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11Z" stroke="currentColor" strokeWidth="2" />
                      <circle cx="12" cy="10" r="2.5" fill="currentColor" />
                    </svg>
                    Navigate
                  </a>
                </div>
              </div>

              {out && (
                <button
                  onClick={() => delivered(o.orderNumber)}
                  className="w-full bg-red py-4 text-base font-bold text-cream transition hover:bg-red-deep active:scale-[0.99]"
                >
                  Mark delivered
                </button>
              )}
            </article>
          );
        })}
      </div>
    </main>
  );
}
