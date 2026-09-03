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
import { reorder } from "@/lib/reorder";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/sections/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ChatDock } from "@/components/chat/ChatDock";
import { PageTitleBand } from "@/components/ds/PageTitleBand";
import { PillCta } from "@/components/ds/PillCta";

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

  const busy = stage === "busy";

  return (
    <div className="f-card f-card--pad-lg">
      <h2 className="f-heading f-heading--sm">Ordered from another device?</h2>
      <p className="mt-2 text-ink-600">
        Sign in with your mobile number and we&apos;ll send a one-time code to pull up your order history.
      </p>

      <div className="mt-6 grid gap-4 sm:max-w-sm">
        {stage !== "code" ? (
          <>
            <div className="f-field">
              <label htmlFor="orders-phone" className="f-field__label">
                Mobile number
              </label>
              <input
                id="orders-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0300 1234567"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                aria-label="Mobile number"
                className="f-input"
              />
            </div>
            <button
              onClick={request}
              disabled={busy || phone.replace(/\D/g, "").length < 11}
              className={`f-btn f-btn--red f-btn--md f-btn--block ${busy ? "is-loading" : ""}`}
            >
              {busy ? "Sending..." : "Send code"}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-ink-600">
              Code sent to <span className="font-semibold text-ink-900">{phone}</span>.
              {devCode && (
                <span className="f-toolchip mt-2 block w-fit font-mono">Dev mode - your code is {devCode}</span>
              )}
            </p>
            <div className="f-field">
              <label htmlFor="orders-code" className="f-field__label">
                One-time code
              </label>
              <input
                id="orders-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6-digit code"
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-label="One-time code"
                className="f-input f-input--pin"
              />
            </div>
            <button
              onClick={verify}
              disabled={code.length !== 6}
              className={`f-btn f-btn--red f-btn--md f-btn--block ${busy ? "is-loading" : ""}`}
            >
              Verify &amp; show my orders
            </button>
            <button onClick={() => setStage("phone")} className="f-btn f-btn--quiet justify-self-start">
              Use a different number
            </button>
          </>
        )}
        {message && (
          <p role="alert" className="f-notice f-notice--error">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

function ReorderButton({ order }: { order: OrderView }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      onClick={async () => {
        setBusy(true);
        await reorder(order);
        setBusy(false);
      }}
      disabled={busy}
      className={`f-btn f-btn--outline f-btn--sm ${busy ? "is-loading" : ""}`}
    >
      Order it again
    </button>
  );
}

function statusTone(status: string): string {
  if (status === "CANCELLED") return "f-tag--muted";
  if (status === "DELIVERED") return "f-tag--white";
  return "f-tag--red";
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
      <main id="main" className="bg-white">
        <PageTitleBand
          title="Your Orders"
          tag="Account"
          tag2="Reorder"
          lede="Everything you have ordered from this device or phone number."
        />

        <div className="wrap wrap-narrow pb-24 pt-10">
          {customer && (
            <p className="text-sm text-ink-600">
              Signed in as <span className="font-semibold text-ink-900">{customer.phone}</span>{" "}
              <button onClick={signOut} className="f-btn f-btn--quiet ml-2">
                Sign out
              </button>
            </p>
          )}

          <div className={`grid gap-4 ${customer ? "mt-6" : ""}`}>
            {orders === null && <div className="h-40 animate-pulse rounded-[10px] bg-cream" />}
            {orders?.length === 0 && (
              <div className="f-card f-card--pad-lg f-empty">
                <p className="f-empty__text">No orders on this device yet. Your first one is a scroll away.</p>
                <PillCta href="/menu">See the menu</PillCta>
              </div>
            )}
            {orders?.map((o) => (
              <article key={o.orderNumber} className="f-card f-card--sm overflow-hidden">
                <Link href={`/track/${o.orderNumber}`} className="block p-6 pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-display text-xl uppercase text-red">{o.orderNumber}</p>
                      <p className="mt-1 text-sm text-ink-600">
                        {new Date(o.placedAt).toLocaleDateString("en-PK", { day: "numeric", month: "short" })} ·{" "}
                        {o.lines.reduce((n, l) => n + l.qty, 0)} items · {o.branchName ?? "FOUR"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`f-tag ${statusTone(o.status)}`}>
                        {ORDER_STATUS_LABELS[o.status as OrderStatusName] ?? o.status}
                      </span>
                      <span className="font-display text-lg text-red">{formatPKR(o.total)}</span>
                    </div>
                  </div>
                  <p className="mt-3 truncate text-sm text-ink-600">
                    {o.lines.map((l) => `${l.qty}x ${l.name}`).join(", ")}
                  </p>
                </Link>
                <div className="flex items-center gap-4 border-t border-rule px-6 py-3">
                  <ReorderButton order={o} />
                  <Link href={`/track/${o.orderNumber}`} className="f-btn f-btn--quiet">
                    Track →
                  </Link>
                </div>
              </article>
            ))}

            {!customer && orders !== null && <SignIn onSignedIn={refresh} />}
          </div>
        </div>
      </main>
      <Footer />
      <CartDrawer />
      <ChatDock />
    </>
  );
}
