"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HOURS_LABEL, LAHORE_AREAS, formatPKR, type OrderQuote, type OrderView } from "@four/shared";
import { api, ApiError } from "@/lib/api";
import { useKitchenOpen } from "@/lib/useKitchenOpen";
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
  // the server refuses orders outside opening hours; mirror that here so the
  // customer is told before filling the form in, not after submitting it
  const open = useKitchenOpen();
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
      // an online-payment order is held at the gateway until paid
      if (order.paymentUrl) {
        window.location.assign(order.paymentUrl);
      } else {
        router.push(`/track/${order.orderNumber}`);
      }
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

  const inputCls = (err?: string) => `f-input${err ? " is-invalid" : ""}`;
  const selectCls = (err?: string) => `f-input f-select${err ? " is-invalid" : ""}`;

  return (
    <div className="f-drawer__body">
      <button onClick={onBack} className="f-btn f-btn--quiet mb-4">
        &larr; Back to cart
      </button>

      <div className="grid gap-4">
        <label className="f-field">
          <span className="f-field__label">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            autoComplete="name"
            aria-invalid={fieldErrors.name ? true : undefined}
            aria-describedby={fieldErrors.name ? "err-name" : undefined}
            className={inputCls(fieldErrors.name)}
          />
          {fieldErrors.name && (
            <span id="err-name" className="f-field__error">
              {fieldErrors.name}
            </span>
          )}
        </label>

        <label className="f-field">
          <span className="f-field__label">Mobile number</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0300 1234567"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            aria-invalid={fieldErrors.phone ? true : undefined}
            aria-describedby={fieldErrors.phone ? "err-phone" : undefined}
            className={inputCls(fieldErrors.phone)}
          />
          {fieldErrors.phone && (
            <span id="err-phone" className="f-field__error">
              {fieldErrors.phone}
            </span>
          )}
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="f-field">
            <span className="f-field__label">Area</span>
            <select
              value={areaId}
              onChange={(e) => {
                setAreaId(e.target.value);
                setBlock("");
              }}
              aria-invalid={fieldErrors.area ? true : undefined}
              aria-describedby={fieldErrors.area ? "err-area" : undefined}
              className={selectCls(fieldErrors.area)}
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
          <label className="f-field">
            <span className="f-field__label">Block</span>
            <select
              value={block}
              onChange={(e) => setBlock(e.target.value)}
              disabled={!area}
              aria-invalid={fieldErrors.area ? true : undefined}
              aria-describedby={fieldErrors.area ? "err-area" : undefined}
              className={selectCls(fieldErrors.area)}
            >
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
          {fieldErrors.area && (
            <span id="err-area" className="f-field__error col-span-2 -mt-2">
              {fieldErrors.area}
            </span>
          )}
        </div>

        <label className="f-field">
          <span className="f-field__label">Street address</span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="House 12, Street 8"
            autoComplete="street-address"
            aria-invalid={fieldErrors.address ? true : undefined}
            aria-describedby={fieldErrors.address ? "err-address" : undefined}
            className={inputCls(fieldErrors.address)}
          />
          {fieldErrors.address && (
            <span id="err-address" className="f-field__error">
              {fieldErrors.address}
            </span>
          )}
        </label>

        <label className="f-field">
          <span className="f-field__label">Order note (optional)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Extra sauce, no onions..." className={inputCls()} />
        </label>

        <div className="f-field">
          <span id="pay-label" className="f-field__label">
            Payment
          </span>
          <div role="radiogroup" aria-labelledby="pay-label" className="grid grid-cols-2 gap-3">
            <button
              role="radio"
              aria-checked={payment === "COD"}
              onClick={() => setPayment("COD")}
              className={`f-chip f-chip--square f-chip--soft justify-center ${payment === "COD" ? "is-on" : ""}`}
            >
              Cash on delivery
            </button>
            <button
              role="radio"
              aria-checked={payment === "CARD"}
              onClick={() => setPayment("CARD")}
              className={`f-chip f-chip--square f-chip--soft justify-center ${payment === "CARD" ? "is-on" : ""}`}
            >
              Card on delivery
            </button>
          </div>
        </div>

        {errorMsg && (
          <p role="alert" className="f-notice f-notice--error">
            {errorMsg}
          </p>
        )}

        {quote && (
          <dl className="f-summary f-summary--ruled mt-1">
            <div className="f-summary__row">
              <dt>Subtotal</dt>
              <dd>{formatPKR(quote.subtotal)}</dd>
            </div>
            <div className="f-summary__row">
              <dt>Delivery</dt>
              <dd>{quote.deliveryFee === 0 ? "Free" : formatPKR(quote.deliveryFee)}</dd>
            </div>
            <div className="f-summary__row">
              <dt>Tax ({Math.round(quote.taxRate * 100)}%)</dt>
              <dd>{formatPKR(quote.tax)}</dd>
            </div>
            <div className="f-summary__row is-total">
              <dt>Total</dt>
              <dd>{formatPKR(quote.total)}</dd>
            </div>
          </dl>
        )}

        <button
          onClick={place}
          disabled={stage === "placing" || !quote || !open}
          className={`f-btn f-btn--red f-btn--lg f-btn--block mt-1 ${stage === "placing" ? "is-loading" : ""}`}
        >
          {!open
            ? "Kitchen closed"
            : stage === "placing"
              ? "Placing your order..."
              : quote
                ? `Place order · ${formatPKR(quote.total)}`
                : "Cart is empty"}
        </button>
        {!open && (
          <p className="mt-3 text-center text-sm font-medium text-ink-600">
            We are closed right now. {HOURS_LABEL} - your cart will still be here.
          </p>
        )}
      </div>
    </div>
  );
}
