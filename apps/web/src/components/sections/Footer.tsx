import Link from "next/link";
import { BRAND, BRANCHES, HOURS_LABEL, DELIVERY_FEE, FREE_DELIVERY_ABOVE, formatPKR } from "@four/shared";
import { BrandLogo } from "../BrandLogo";

const ORDER_LINKS = [
  { href: "/menu", label: "Menu" },
  { href: "/deals", label: "Deals" },
  { href: "/orders", label: "My Orders" },
];

const COMPANY_LINKS = [
  { href: "/about", label: "Our Food" },
  { href: "/locations", label: "Locations" },
  { href: "/support", label: "Support" },
];

const colHeading = "text-xs font-extrabold uppercase tracking-[0.16em] text-ink-600";
const link = "font-bold uppercase tracking-[0.04em] !text-ink-900 transition hover:!text-red";

/**
 * Chain-grade footer: an order-CTA band, four columns of real links and
 * facts, and a fact bar. Stays a server component - every value renders
 * from @four/shared, nothing here is live.
 */
export function Footer() {
  return (
    <footer className="border-t-2 border-ink-900 bg-paper-100">
      {/* Row 0 - the order CTA band */}
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 border-b-2 border-paper-300 px-4 py-8 sm:px-6">
        <div>
          <p className="f-heading f-heading--md">Hungry? We&apos;re on.</p>
          <p className="mt-1 text-sm font-semibold text-ink-600">{HOURS_LABEL}.</p>
        </div>
        <Link href="/menu" className="f-btn f-btn--primary f-btn--md">
          Order now
        </Link>
      </div>

      {/* Row 1 - four columns */}
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <span className="!text-red">
            <BrandLogo className="h-8" />
          </span>
          <p className="mt-3 max-w-[40ch] text-sm text-ink-600">
            Smash burgers, crown crust pizzas and shakes, made fresh in three Lahore kitchens.
          </p>
          <a
            href={BRAND.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm font-bold !text-ink-900 transition hover:!text-red"
          >
            {BRAND.instagramHandle}
          </a>
        </div>

        <nav aria-label="Order" className="grid content-start gap-2 text-sm">
          <span className={colHeading}>Order</span>
          {ORDER_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={link}>
              {l.label}
            </Link>
          ))}
          <a
            href="https://www.foodpanda.pk/restaurant/lmmc/four"
            target="_blank"
            rel="noopener noreferrer"
            className={link}
          >
            foodpanda
          </a>
        </nav>

        <nav aria-label="FOUR" className="grid content-start gap-2 text-sm">
          <span className={colHeading}>FOUR</span>
          {COMPANY_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={link}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="grid content-start gap-2 text-sm text-ink-600">
          <span className={colHeading}>Find us</span>
          {BRANCHES.map((b) => (
            <Link key={b.id} href="/locations" className="!text-ink-600 transition hover:!text-red">
              <span className="font-extrabold text-ink-900">{b.shortName}</span> · {b.address.replace(", Lahore", "")}
            </Link>
          ))}
          <a href={BRAND.phoneHref} className="mt-1 font-extrabold !text-ink-900 transition hover:!text-red">
            {BRAND.phone}
          </a>
          <span>{HOURS_LABEL}</span>
        </div>
      </div>

      {/* Row 2 - fact bar */}
      <div className="border-t-2 border-paper-300">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-ink-600 sm:px-6">
          <span>&copy; {new Date().getFullYear()} FOUR · Lahore, Pakistan. All rights reserved.</span>
          <span>
            All prices exclusive of tax · Delivery {formatPKR(DELIVERY_FEE)}, free over {formatPKR(FREE_DELIVERY_ABOVE)}
          </span>
        </div>
      </div>
    </footer>
  );
}
