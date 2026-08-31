"use client";

/**
 * Order history for the customer account that guest checkout creates
 * implicitly (phone = identity, linked to this browser's session).
 *
 * On a new device the history is empty until the customer proves they own
 * the phone number: a one-time code (WhatsApp/SMS once configured; the dev
 * console adapter logs it) links this session to the account.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { ORDER_STATUS_LABELS, formatPKR, type OrderView, type OrderStatusName } from "@four/shared";
import { api, ApiError } from "@/lib/api";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/sections/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ChatDock } from "@/components/chat/ChatDock";

type Customer = { id: string; name: string; phone: string };

function SignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"phone" | "code" | "busy">("phone");
  const [devCode, setDevCode] = useState("");
  const [message, setMessage] = useState("");

  const request = async () => {
    setStage("busy");
    setMessage("");
    try {
      const r = await api<{ ok: true; devCode?: string }>("/api/auth/request-code", {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
      if (r.devCode) setDevCode(r.devCode);
      setStage("code");
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : "Could not send the code - try again.");
      setStage("phone");
    }
  };

  const verify = async () => {
    setStage("busy");
    setMessage("");
    try {
      await api("/api/auth/verify-code", { method: "POST", body: JSON.stringify({ phone, code }) });
      onSignedIn();
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : "Could not verify the code - try again.");
      setStage("code");
    }
  };

  return (
    <div className="rounded-card bg-cream p-8 border-2 border-ink-900 [box-shadow:var(--shadow-pop-lg)]">
      <h2 className="font-display text-xl font-semibold text-ink">Ordered from another device?</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Sign in with your mobile number and we&apos;ll send a one-time code to pull up your order history.
      </p>

      <div className="mt-5 grid gap-3 sm:max-w-sm">
        {stage !== "code" ? (
          <>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0300 1234567"
              inputMode="tel"
              aria-label="Mobile number"
              className="h-12 w-full rounded-xl border-2 border-ink-900/25 bg-beige/40 px-4 text-ink outline-none transition focus:border-red focus:ring-2 focus:ring-red/30"
            />
            <button
              onClick={request}
              disabled={stage === "busy" || phone.replace(/\D/g, "").length < 11}
              className="rounded-full bg-red py-3 text-sm font-semibold text-cream transition hover:bg-red-deep disabled:opacity-50 border-2 border-ink-900 [box-shadow:var(--shadow-pop)]"
            >
              {stage === "busy" ? "Sending..." : "Send code"}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-ink-soft">
              Code sent to <span className="font-semibold text-ink">{phone}</span>.
              {devCode && (
                <span className="mt-1 block rounded-lg bg-beige/60 px-3 py-2 font-mono text-xs">
                  Dev mode - your code is {devCode}
                </span>
              )}
            </p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6-digit code"
              inputMode="numeric"
              aria-label="One-time code"
              className="h-12 w-full rounded-xl border-2 border-ink-900/25 bg-beige/40 px-4 text-center font-mono text-lg tracking-[0.4em] text-ink outline-none transition focus:border-red focus:ring-2 focus:ring-red/30"
            />
            <button
              onClick={verify}
              disabled={code.length !== 6}
              className="rounded-full bg-red py-3 text-sm font-semibold text-cream transition hover:bg-red-deep disabled:opacity-50 border-2 border-ink-900 [box-shadow:var(--shadow-pop)]"
            >
              Verify &amp; show my orders
            </button>
            <button onClick={() => setStage("phone")} className="text-xs font-medium text-ink-soft hover:text-ink">
              Use a different number
            </button>
          </>
        )}
        {message && (
          <p role="alert" className="rounded-xl bg-red/10 px-4 py-3 text-sm font-medium text-red">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderView[] | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);

  const refresh = () => {
    api<{ orders: OrderView[] }>("/api/orders/mine")
      .then((d) => setOrders(d.orders))
      .catch(() => setOrders([]));
    api<{ customer: Customer | null }>("/api/auth/me")
      .then((d) => setCustomer(d.customer))
      .catch(() => setCustomer(null));
  };

  useEffect(refresh, []);

  const signOut = async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    refresh();
  };

  return (
    <>
      <Nav />
      <main className="mx-auto min-h-[calc(100dvh-4rem)] max-w-3xl px-4 pb-24 pt-28 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-4xl font-semibold text-ink">Your orders</h1>
            <p className="mt-2 text-ink-soft">Everything you have ordered from this device or phone number.</p>
          </div>
          {customer && (
            <p className="text-sm text-ink-soft">
              Signed in as <span className="font-semibold text-ink">{customer.phone}</span>{" "}
              <button onClick={signOut} className="ml-2 font-medium text-red hover:underline">
                Sign out
              </button>
            </p>
          )}
        </div>

        <div className="mt-8 grid gap-4">
          {orders === null && <div className="h-40 animate-pulse rounded-card bg-beige-deep/60 border-2 border-ink-900/25" />}
          {orders?.length === 0 && (
            <div className="rounded-card bg-cream p-10 text-center border-2 border-ink-900 [box-shadow:var(--shadow-pop-lg)]">
              <p className="text-ink-soft">No orders on this device yet. Your first one is a scroll away.</p>
              <Link
                href="/#menu"
                className="mt-4 inline-block rounded-full bg-red px-6 py-3 text-sm font-semibold text-cream transition hover:bg-red-deep border-2 border-ink-900 [box-shadow:var(--shadow-pop)]"
              >
                See the menu
              </Link>
            </div>
          )}
          {orders?.map((o) => (
            <Link
              key={o.orderNumber}
              href={`/track/${o.orderNumber}`}
              className="f-card--interactive group rounded-card bg-cream p-6 border-2 border-ink-900 [box-shadow:var(--shadow-pop-lg)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display text-xl font-semibold text-ink group-hover:text-red">{o.orderNumber}</p>
                  <p className="text-sm text-ink-soft">
                    {new Date(o.placedAt).toLocaleDateString("en-PK", { day: "numeric", month: "short" })} ·{" "}
                    {o.lines.reduce((n, l) => n + l.qty, 0)} items · {o.branchName ?? "FOUR"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                      o.status === "CANCELLED" ? "bg-ink/10 text-ink-soft" : o.status === "DELIVERED" ? "bg-ink/10 text-ink" : "bg-red text-cream"
                    }`}
                  >
                    {ORDER_STATUS_LABELS[o.status as OrderStatusName] ?? o.status}
                  </span>
                  <span className="font-bold text-ink">{formatPKR(o.total)}</span>
                </div>
              </div>
              <p className="mt-3 truncate text-sm text-ink-soft">
                {o.lines.map((l) => `${l.qty}x ${l.name}`).join(", ")}
              </p>
            </Link>
          ))}

          {!customer && orders !== null && <SignIn onSignedIn={refresh} />}
        </div>
      </main>
      <Footer />
      <CartDrawer />
      <ChatDock />
    </>
  );
}
