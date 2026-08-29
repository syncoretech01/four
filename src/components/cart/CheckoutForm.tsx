"use client";

import { useState } from "react";
import { LAHORE_AREAS, findArea } from "@/data/locations";
import { formatPKR } from "@/data/menu";
import { useStore, cartSummary } from "@/lib/store";

type Stage = "form" | "placing" | "done" | "error";

/** Checkout: contact + address (pre-filled from the location popup) + payment, then places the order through the POS bridge. */
export function CheckoutForm({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const lines = useStore((s) => s.lines);
  const location = useStore((s) => s.location);
  const setLocation = useStore((s) => s.setLocation);
  const clear = useStore((s) => s.clear);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [areaId, setAreaId] = useState(location?.areaId ?? "");
  const [block, setBlock] = useState(location?.block ?? "");
  const [payment, setPayment] = useState<"cod" | "card">("cod");
  const [note, setNote] = useState("");
  const [stage, setStage] = useState<Stage>("form");
  const [orderNumber, setOrderNumber] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { priced, subtotal, delivery, total } = cartSummary(lines);
  const area = areaId ? findArea(areaId) : undefined;

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
    if (!validate()) return;
    setStage("placing");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name: name.trim(), phone: phone.trim() },
          delivery: { areaId, areaName: area!.name, block, address: address.trim(), note: note.trim() || undefined },
          payment,
          lines: priced.map((l) => ({ itemId: l.itemId, variantId: l.variantId, qty: l.qty })),
        }),
      });
      const data = (await res.json()) as { ok: boolean; orderNumber?: string; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Order could not be placed.");
      setOrderNumber(data.orderNumber!);
      setLocation({ areaId, areaName: area!.name, block });
      clear();
      setStage("done");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setStage("error");
    }
  };

  if (stage === "done") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red text-cream">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 12.5l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h3 className="font-display text-3xl text-ink">ORDER PLACED</h3>
        <p className="text-ink-soft">
          Your order <strong className="text-ink">{orderNumber}</strong> is with the kitchen. We will call{" "}
          <strong className="text-ink">{phone}</strong> to confirm.
        </p>
        <button onClick={onDone} className="mt-2 rounded-full bg-red px-8 py-3.5 font-semibold text-cream transition hover:bg-red-deep">
          Done
        </button>
      </div>
    );
  }

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
              <option value="" disabled>Area</option>
              {LAHORE_AREAS.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink">Block</span>
            <select value={block} onChange={(e) => setBlock(e.target.value)} disabled={!area} className={inputCls(fieldErrors.area)}>
              <option value="" disabled>Block</option>
              {area?.blocks.map((b) => (
                <option key={b} value={b}>{b}</option>
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
              onClick={() => setPayment("cod")}
              className={`rounded-xl border-2 px-4 py-3.5 text-sm font-semibold transition ${
                payment === "cod" ? "border-red bg-red/5 text-red" : "border-ink/15 text-ink hover:border-ink/40"
              }`}
            >
              Cash on delivery
            </button>
            <button
              onClick={() => setPayment("card")}
              className={`rounded-xl border-2 px-4 py-3.5 text-sm font-semibold transition ${
                payment === "card" ? "border-red bg-red/5 text-red" : "border-ink/15 text-ink hover:border-ink/40"
              }`}
            >
              Card on delivery
            </button>
          </div>
        </div>

        {stage === "error" && (
          <p role="alert" className="rounded-xl bg-red/10 px-4 py-3 text-sm font-medium text-red">
            {errorMsg}
          </p>
        )}

        <dl className="mt-1 grid gap-1 border-t border-ink/10 pt-4 text-sm">
          <div className="flex justify-between text-ink-soft"><dt>Subtotal</dt><dd>{formatPKR(subtotal)}</dd></div>
          <div className="flex justify-between text-ink-soft"><dt>Delivery</dt><dd>{delivery === 0 ? "Free" : formatPKR(delivery)}</dd></div>
          <div className="flex justify-between text-base font-bold text-ink"><dt>Total</dt><dd>{formatPKR(total)}</dd></div>
        </dl>

        <button
          onClick={place}
          disabled={stage === "placing" || priced.length === 0}
          className="mt-1 w-full rounded-full bg-red py-4 text-base font-semibold text-cream transition hover:bg-red-deep active:scale-[0.98] disabled:opacity-50"
        >
          {stage === "placing" ? "Placing your order..." : `Place order · ${formatPKR(total)}`}
        </button>
      </div>
    </div>
  );
}
