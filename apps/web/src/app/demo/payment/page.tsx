"use client";

/**
 * Online payment walkthrough, for showing stakeholders what paying online
 * would look like before a merchant account exists.
 *
 * Deliberately standalone: it does not touch the cart, place an order, or call
 * the API. Nothing here can charge anyone, and every screen says so - a demo
 * that could be mistaken for a real checkout is worse than no demo.
 */

import { useState } from "react";
import Link from "next/link";
import { BRAND, formatPKR } from "@four/shared";

type Method = "card" | "easypaisa" | "jazzcash";
type Stage = "choose" | "gateway" | "approved" | "declined";

const METHODS: { id: Method; label: string; blurb: string }[] = [
  { id: "card", label: "Debit / credit card", blurb: "Visa and Mastercard, entered on the provider's page" },
  { id: "easypaisa", label: "Easypaisa", blurb: "Approve in the Easypaisa app" },
  { id: "jazzcash", label: "JazzCash", blurb: "Approve in the JazzCash app" },
];

// a plausible basket, so the numbers on screen look like a real order
const SUBTOTAL = 2196;
const DELIVERY = 149;
const TAX = Math.round(SUBTOTAL * 0.08); // card rate
const TOTAL = SUBTOTAL + DELIVERY + TAX;

export default function PaymentDemoPage() {
  const [method, setMethod] = useState<Method>("card");
  const [stage, setStage] = useState<Stage>("choose");

  const chosen = METHODS.find((m) => m.id === method)!;

  return (
    <main className="min-h-dvh bg-cream-dark px-4 py-10">
      <div className="mx-auto grid max-w-lg gap-5">
        <div className="rounded-xl border border-dashed border-rule bg-red/5 px-4 py-3">
          <p className="text-sm font-bold uppercase tracking-wide text-red">Demonstration only</p>
          <p className="mt-1 text-sm text-ink-600">
            Nothing on this page charges anyone. There is no payment provider connected, no order is
            created, and no card details are collected or sent anywhere.
          </p>
        </div>

        <div className="rounded-card bg-cream p-7 border border-rule">
          <h1 className="font-display text-2xl text-ink-900">Pay online</h1>
          <p className="mt-1 text-sm text-ink-600">
            How online payment would work once {BRAND.name} has a merchant account.
          </p>

          <dl className="mt-6 grid gap-1.5 border-y border-rule py-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-600">Subtotal</dt>
              <dd className="tabular-nums text-ink-900">{formatPKR(SUBTOTAL)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-600">Delivery</dt>
              <dd className="tabular-nums text-ink-900">{formatPKR(DELIVERY)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-600">Tax (8% card)</dt>
              <dd className="tabular-nums text-ink-900">{formatPKR(TAX)}</dd>
            </div>
            <div className="mt-1 flex justify-between text-base font-semibold">
              <dt className="text-ink-900">Total</dt>
              <dd className="tabular-nums text-ink-900">{formatPKR(TOTAL)}</dd>
            </div>
          </dl>

          {stage === "choose" && (
            <>
              <div className="mt-6 grid gap-3">
                {METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`rounded-xl border px-4 py-3.5 text-left transition ${
                      method === m.id ? "border-red bg-red/5" : "border-rule"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-ink-900">{m.label}</span>
                    <span className="block text-xs text-ink-600">{m.blurb}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStage("gateway")}
                className="f-btn f-btn--red f-btn--md f-btn--block mt-5"
              >
                Continue to {chosen.label}
              </button>
            </>
          )}

          {stage === "gateway" && (
            <div className="mt-6 grid gap-4">
              <div className="rounded-xl bg-ink-900/5 p-5 text-center">
                <p className="text-sm font-semibold text-ink-900">{chosen.label}</p>
                <p className="mt-1 text-xs text-ink-600">
                  The real flow hands off to the provider here, so card details never reach
                  {" "}{BRAND.name}&apos;s servers.
                </p>
              </div>
              <p className="text-center text-xs text-ink-600">Simulate the provider&apos;s response:</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setStage("approved")}
                  className="f-btn f-btn--red f-btn--md"
                >
                  Approve
                </button>
                <button
                  onClick={() => setStage("declined")}
                  className="f-btn f-btn--outline f-btn--md"
                >
                  Decline
                </button>
              </div>
            </div>
          )}

          {stage === "approved" && (
            <div className="mt-6 grid gap-3 text-center">
              <p className="font-display text-xl text-ink-900">Payment approved</p>
              <p className="text-sm text-ink-600">
                The order would now be confirmed and sent to the kitchen, exactly as a cash order is
                today. No money moved: this is a demonstration.
              </p>
            </div>
          )}

          {stage === "declined" && (
            <div className="mt-6 grid gap-3 text-center">
              <p className="font-display text-xl text-ink-900">Payment declined</p>
              <p className="text-sm text-ink-600">
                No order is created and the cart is kept, so the customer can try another method.
              </p>
            </div>
          )}

          {stage !== "choose" && (
            <button
              onClick={() => setStage("choose")}
              className="f-btn f-btn--outline f-btn--md f-btn--block mt-5"
            >
              Start again
            </button>
          )}
        </div>

        <Link href="/" className="text-center text-sm font-medium text-ink-600 underline-offset-4 hover:underline">
          Back to the site
        </Link>
      </div>
    </main>
  );
}
