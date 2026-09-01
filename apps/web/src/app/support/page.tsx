import type { Metadata } from "next";
import Link from "next/link";
import {
  BRAND,
  BRANCHES,
  HOURS_LABEL,
  LAHORE_AREAS,
  DELIVERY_FEE,
  FREE_DELIVERY_ABOVE,
  BASE_DELIVERY_MINUTES,
  DEFAULT_TAX_RATE_COD,
  DEFAULT_TAX_RATE_CARD,
  formatPKR,
} from "@four/shared";
import { MEAL_DEAL_FROM } from "@/lib/deals";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/sections/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ChatDock } from "@/components/chat/ChatDock";
import { LocationGate } from "@/components/LocationModal";

export const metadata: Metadata = {
  title: "Support & FAQs",
  description:
    "Answers about FOUR delivery in Lahore: hours (1 pm - 3 am daily), delivery areas and fees, cash or card on delivery, order tracking and cancellations. Or call 0325 1231222.",
  alternates: { canonical: "/support" },
};

const codPct = Math.round(DEFAULT_TAX_RATE_COD * 100);
const cardPct = Math.round(DEFAULT_TAX_RATE_CARD * 100);

/**
 * One const drives both the rendered accordion and the FAQPage JSON-LD, so
 * what search engines index can never diverge from what customers read.
 * Every answer is grounded in @four/shared or real checkout behavior.
 */
const FAQ_GROUPS: { group: string; faqs: { q: string; a: string }[] }[] = [
  {
    group: "Ordering & delivery",
    faqs: [
      {
        q: "What are your opening hours?",
        a: `Every branch is ${HOURS_LABEL.toLowerCase().replace("open ", "open ")}. Yes, that includes the 2am order.`,
      },
      {
        q: "Which areas do you deliver to?",
        a: `${LAHORE_AREAS.length} areas across Lahore — DHA Phases 1–8, Gulberg 1–3, Model Town, Johar Town, Wapda Town, Bahria Town, Lake City, Cantt and more. Your order routes automatically to the nearest of our ${BRANCHES.length} kitchens. Check your block on the Locations page.`,
      },
      {
        q: "How much is delivery?",
        a: `${formatPKR(DELIVERY_FEE)} flat, anywhere we deliver. Orders over ${formatPKR(FREE_DELIVERY_ABOVE)} deliver free.`,
      },
      {
        q: "How long does delivery take?",
        a: `Most orders arrive in about ${BASE_DELIVERY_MINUTES}–${BASE_DELIVERY_MINUTES + 10} minutes; farther areas take a little longer. You'll see the estimate for your exact area the moment you set your delivery block, and again at checkout.`,
      },
      {
        q: "Is there a minimum order?",
        a: `No minimum. The ${formatPKR(DELIVERY_FEE)} delivery fee applies below ${formatPKR(FREE_DELIVERY_ABOVE)}.`,
      },
      {
        q: "Can I dine in or pick up?",
        a: `You can dine in at any of our ${BRANCHES.length} branches — Fairways DHA Phase 6, Allama Iqbal Town and Lake City. Online ordering is delivery-only for now.`,
      },
    ],
  },
  {
    group: "Payment & prices",
    faqs: [
      {
        q: "How can I pay?",
        a: "Cash on delivery, or card on delivery when the rider arrives.",
      },
      {
        q: "Why is the total different when I switch to card?",
        a: `Menu prices are exclusive of tax. Restaurant sales tax is ${codPct}% on cash and ${cardPct}% on card payments, so paying by card is usually cheaper.`,
      },
      {
        q: "What's a meal deal?",
        a: `Any burger becomes a meal from ${formatPKR(MEAL_DEAL_FROM)} — fries + soda, fries + mint margarita, or fries + fizz. Pick the option inside any burger, and see the Deals page for what each one saves.`,
      },
    ],
  },
  {
    group: "Your order",
    faqs: [
      {
        q: "How do I track my order?",
        a: "Placing an order takes you straight to its live tracking page — status updates and, once your rider leaves, their position on the map in real time.",
      },
      {
        q: "Do I need an account to order?",
        a: "No. You check out with just your name, phone and address. Your phone number is your account — to see past orders on a new device, we text a one-time code to verify it's you.",
      },
      {
        q: "Can I change or cancel my order?",
        a: `Call us at ${BRAND.phone} right away and we'll do our best. Once your food is on the pass we can't cancel it.`,
      },
    ],
  },
  {
    group: "The food",
    faqs: [
      {
        q: "Do you have allergen information?",
        a: "Our kitchens handle gluten, dairy, eggs, sesame and nuts — the Snickers Shake contains peanuts, and our lava cookies and cheesecakes contain dairy, eggs and gluten. If you have an allergy, call us before ordering and we'll walk you through the menu.",
      },
      {
        q: "Is everything really made from scratch?",
        a: "The patties are hand-rolled 110g balls smashed to order, the crown crusts are stuffed by hand, and every sauce and dip is made in our own kitchens. If it's on the menu, we make it.",
      },
    ],
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_GROUPS.flatMap((g) =>
    g.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  ),
};

export default function SupportPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Nav />
      <main id="main">
        {/* ── Hero ── */}
        <header className="wrap pt-28 sm:pt-32">
          <p className="f-eyebrow">Support</p>
          <h1 className="f-heading f-heading--lg sm:text-7xl">How Can We Help?</h1>
          <p className="f-lede">Most answers are below. For anything about a live order, call us — it&apos;s faster.</p>
        </header>

        {/* ── Contact cards ── */}
        <div className="wrap pt-10">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="f-card f-card--pad">
              <p className="f-eyebrow !mb-2">Call us</p>
              <a href={BRAND.phoneHref} className="font-display text-3xl font-bold !text-red">
                {BRAND.phone}
              </a>
              <p className="mt-2 text-sm text-ink-600">{HOURS_LABEL}. For live orders, changes and cancellations.</p>
            </div>
            <div className="f-card f-card--pad">
              <p className="f-eyebrow !mb-2">DM us</p>
              <a
                href={BRAND.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="font-display text-3xl font-bold !text-red"
              >
                {BRAND.instagramHandle}
              </a>
              <p className="mt-2 text-sm text-ink-600">For everything that isn&apos;t a live order.</p>
            </div>
            <div className="f-card f-card--pad">
              <p className="f-eyebrow !mb-2">Walk in</p>
              <p className="font-display text-3xl font-bold uppercase text-ink-900">{BRANCHES.length} branches</p>
              <p className="mt-2 text-sm text-ink-600">Across Lahore, {HOURS_LABEL.toLowerCase()}.</p>
              <Link href="/locations" className="f-btn f-btn--secondary f-btn--sm mt-4">
                Find a branch
              </Link>
            </div>
          </div>
        </div>

        {/* ── FAQs ── */}
        <div className="wrap band">
          <div className="grid gap-10 lg:grid-cols-[16rem_1fr]">
            <div>
              <p className="f-eyebrow">FAQs</p>
              <h2 className="f-heading f-heading--md">Quick answers</h2>
            </div>
            <div className="grid gap-8">
              {FAQ_GROUPS.map((g) => (
                <section key={g.group}>
                  <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-ink-600">{g.group}</h3>
                  <div className="mt-3 grid gap-3">
                    {g.faqs.map((f) => (
                      <details
                        key={f.q}
                        className="group rounded-card border-2 border-ink-900 bg-paper-0 [box-shadow:var(--shadow-pop-sm)]"
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-bold text-ink-900 [&::-webkit-details-marker]:hidden">
                          {f.q}
                          <span
                            aria-hidden
                            className="shrink-0 font-display text-2xl leading-none text-red transition-transform group-open:rotate-45"
                          >
                            +
                          </span>
                        </summary>
                        <p className="px-5 pb-5 text-sm leading-relaxed text-ink-600">{f.a}</p>
                      </details>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>

        {/* ── Closing strip ── */}
        <div className="wrap pb-24">
          <div className="f-card f-card--accent f-card--pad-lg flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="f-heading f-heading--md !text-[var(--paper-0)]">Still stuck?</p>
              <p className="mt-1 text-sm font-semibold text-cream/85">
                {BRAND.phone} — {HOURS_LABEL.toLowerCase()}.
              </p>
            </div>
            <a href={BRAND.phoneHref} className="f-btn f-btn--cream f-btn--md">
              Call us now
            </a>
          </div>
        </div>
      </main>
      <Footer />
      <CartDrawer />
      <ChatDock />
      <LocationGate />
    </>
  );
}
