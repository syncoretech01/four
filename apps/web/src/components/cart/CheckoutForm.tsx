"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LAHORE_AREAS, formatPKR, type OrderQuote, type OrderView } from "@four/shared";
import { api, ApiError } from "@/lib/api";
import { useStore } from "@/lib/store";

type Stage = "form" | "placing";

/**
 * Checkout: contact + address (pre-filled from the location popup) +
 * payment. Requoting on payment change keeps the HMAC confirm token in
 * sync; placing the order routes to the live tracking page.
 */
export function CheckoutForm({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const router = useRouter();
  const location = useStore((s) => s.location);
  const setLocation = useStore((s) => s.setLocation);
  const storedQuote = useStore((s) => s.quote);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [areaId, setAreaId] = useState(location?.areaId ?? "");
  const [block, setBlock] = useState(location?.block ?? "");
  const [note, setNote] = useState("");
  const [payment, setPayment] = useState<"COD" | "CARD">(storedQuote?.payment ?? "COD");
  const [quote, setQuote] = useState<OrderQuote | null>(storedQuote);
  const [stage, setStage] = useState<Stage>("form");
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const area = LAHORE_AREAS.find((a) => a.id === areaId);

  useEffect(() => {
    api<OrderQuote>("/api/orders/quote", { method: "POST", body: JSON.stringify({ payment }) })
      .then(setQuote)
      .catch(() => setQuote(null));
  }, [payment]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = "Please enter your name.";
    if (!/^(\+92|0)3\d{2}[\s-]?\d{7}$/.test(phone.replace(/\s/g, ""))) errs.phone = "Enter a valid Pakistani mobile number, e.g. 0300 1234567.";
    if (!area || !block) errs.area = "Choose your delivery area and block.";
    if (address.trim().length < 8) errs.address = "Enter your street address (house, street).";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const place = async () => {
    if (!validate() || !quote) return;
    setStage("placing");
    setErrorMsg("");
    try {
      const order = await api<OrderView>("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          areaId,
          block,
          address: address.trim(),
          note: note.trim() || undefined,
          payment,
          confirmToken: quote.confirmToken,
        }),
      });
      setLocation({ areaId, areaName: area!.name, block });
      onDone();
      router.push(`/track/${order.orderNumber}`);
    } catch (e) {
      setStage("form");
      if (e instanceof ApiError && e.code === "STALE_QUOTE") {
        const fresh = await api<OrderQuote>("/api/orders/quote", { method: "POST", body: JSON.stringify({ payment }) }).catch(() => null);
        setQuote(fresh);
        setErrorMsg("Your cart changed, so the total was refreshed - please confirm again.");
      } else {
        setErrorMsg(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
      }
    }
  };

  const inputCls = (err?: string) =>
    `h-12 w-full rounded-xl border bg-cream px-4 text-ink outline-none transition focus:ring-2 ${
      err ? "border-red focus:border-red focus:ring-red/30" : "border-ink/15 focus:border-red focus:ring-red/30"
    }`;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <button onClick={onBack} className="mb-4 text-sm font-medium text-ink-soft transition hover:text-ink">
        &larr; Back to cart
      </button>

      <div className="grid gap-4">
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={inputCls(fieldErrors.name)} />
          {fieldErrors.name && <span className="text-xs text-red">{fieldErrors.name}</span>}
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink">Mobile number</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0300 1234567"
            inputMode="tel"
            className={inputCls(fieldErrors.phone)}
          />
          {fieldErrors.phone && <span className="text-xs text-red">{fieldErrors.phone}</span>}
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink">Area</span>
            <select
              value={areaId}
              onChange={(e) => {
                setAreaId(e.target.value);
                setBlock("");
              }}
              className={inputCls(fieldErrors.area)}
            >
              <option value="" disabled>
                Area
              </option>
              {LAHORE_AREAS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink">Block</span>
            <select value={block} onChange={(e) => setBlock(e.target.value)} disabled={!area} className={inputCls(fieldErrors.area)}>
              <option value="" disabled>
                Block
              </option>
              {area?.blocks.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
          {fieldErrors.area && <span className="col-span-2 -mt-2 text-xs text-red">{fieldErrors.area}</span>}
        </div>

        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink">Street address</span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="House 12, Street 8"
            className={inputCls(fieldErrors.address)}
          />
          {fieldErrors.address && <span className="text-xs text-red">{fieldErrors.address}</span>}
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink">Order note (optional)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Extra sauce, no onions..." className={inputCls()} />
        </label>

        <div className="grid gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink">Payment</span>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPayment("COD")}
              className={`rounded-xl border-2 px-4 py-3.5 text-sm font-semibold transition ${
                payment === "COD" ? "border-red bg-red/5 text-red" : "border-ink/15 text-ink hover:border-ink/40"
              }`}
            >
              Cash on delivery
            </button>
            <button
              onClick={() => setPayment("CARD")}
              className={`rounded-xl border-2 px-4 py-3.5 text-sm font-semibold transition ${
                payment === "CARD" ? "border-red bg-red/5 text-red" : "border-ink/15 text-ink hover:border-ink/40"
              }`}
            >
              Card on delivery
            </button>
          </div>
        </div>

        {errorMsg && (
          <p role="alert" className="rounded-xl bg-red/10 px-4 py-3 text-sm font-medium text-red">
            {errorMsg}
          </p>
        )}

        {quote && (
          <dl className="mt-1 grid gap-1 border-t border-ink/10 pt-4 text-sm">
            <div className="flex justify-between text-ink-soft">
              <dt>Subtotal</dt>
              <dd>{formatPKR(quote.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-ink-soft">
              <dt>Delivery</dt>
              <dd>{quote.deliveryFee === 0 ? "Free" : formatPKR(quote.deliveryFee)}</dd>
            </div>
            <div className="flex justify-between text-ink-soft">
              <dt>Tax ({Math.round(quote.taxRate * 100)}%)</dt>
              <dd>{formatPKR(quote.tax)}</dd>
            </div>
            <div className="flex justify-between text-base font-bold text-ink">
              <dt>Total</dt>
              <dd>{formatPKR(quote.total)}</dd>
            </div>
          </dl>
        )}

        <button
          onClick={place}
          disabled={stage === "placing" || !quote}
          className="mt-1 w-full rounded-full bg-red py-4 text-base font-semibold text-cream transition hover:bg-red-deep active:scale-[0.98] disabled:opacity-50"
        >
          {stage === "placing" ? "Placing your order..." : quote ? `Place order · ${formatPKR(quote.total)}` : "Cart is empty"}
        </button>
      </div>
    </div>
  );
}
