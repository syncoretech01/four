import Link from "next/link";
import { BRAND, BRANCHES, DELIVERY_FEE, FREE_DELIVERY_ABOVE, HOURS_LABEL, formatPKR } from "@four/shared";
import { DoodleBackdrop } from "../ds/DoodleBackdrop";
import { Ticker } from "../ds/Ticker";

const ORDER_LINKS = [
  { href: "/menu", label: "Menu" },
  { href: "/deals", label: "Deals" },
  { href: "/orders", label: "My Orders" },
  { href: "/orders", label: "Track an order" },
];

const COMPANY_LINKS = [
  { href: "/about", label: "Our Food" },
  { href: "/locations", label: "Locations" },
  { href: "/support", label: "Support" },
];

const FOODPANDA = "https://www.foodpanda.pk/restaurant/lmmc/four";

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Dinevo's footer on FOUR red: a four-cell link strip, the giant ticker of
 * the real wordmark, four widgets of real data, and the bottom bar. Stays a
 * server component - every value renders from @four/shared, nothing is live.
 */
export function Footer() {
  return (
    <footer className="f-footer on-red">
      <DoodleBackdrop />
      <div className="wrap relative z-[1]">
        <div className="f-footer__strip">
          <a href={BRAND.instagram} target="_blank" rel="noopener noreferrer">
            {BRAND.instagramHandle}
            <Arrow />
          </a>
          <a href={BRAND.phoneHref}>
            Call {BRAND.phone}
            <Arrow />
          </a>
          <a href={FOODPANDA} target="_blank" rel="noopener noreferrer">
            foodpanda
            <Arrow />
          </a>
          <Link href="/menu">
            Order online
            <Arrow />
          </Link>
        </div>
      </div>

      <Ticker />

      <div className="wrap relative z-[1]">
        <div className="f-footer__widgets">
          <div>
            <h2 className="f-footer__title">Contact</h2>
            <ul className="f-footer__list text-yellow">
              <li>
                <a href={BRAND.phoneHref} className="f-footer__link text-yellow">
                  {BRAND.phone}
                </a>
              </li>
              <li>
                <a href={BRAND.instagram} target="_blank" rel="noopener noreferrer" className="f-footer__link text-yellow">
                  {BRAND.instagramHandle}
                </a>
              </li>
              <li className="text-sm leading-relaxed">{BRAND.address}</li>
            </ul>
          </div>

          <nav aria-label="Order">
            <h2 className="f-footer__title">Order</h2>
            <ul className="f-footer__list">
              {ORDER_LINKS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="f-footer__link">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <a href={FOODPANDA} target="_blank" rel="noopener noreferrer" className="f-footer__link">
                  foodpanda
                </a>
              </li>
            </ul>
          </nav>

          <nav aria-label="FOUR">
            <h2 className="f-footer__title">FOUR</h2>
            <ul className="f-footer__list">
              {COMPANY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="f-footer__link">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="f-footer__hours">
            <h2 className="f-footer__title">Opening hours</h2>
            <ul className="f-footer__list text-sm">
              <li>
                <span className="block text-white/70">Every day</span>
                <span className="block">{HOURS_LABEL.replace("Open daily ", "")}</span>
              </li>
              <li>
                Delivery {formatPKR(DELIVERY_FEE)}, free over {formatPKR(FREE_DELIVERY_ABOVE)}
              </li>
              <li className="text-white/70">Prices exclusive of tax</li>
              {BRANCHES.map((b) => (
                <li key={b.id}>
                  <Link href="/locations" className="f-footer__link text-sm">
                    <span className="text-yellow">{b.shortName}</span> · {b.address.replace(", Lahore", "")}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="f-footer__bottom">
          <span>&copy; {new Date().getFullYear()} FOUR · Lahore, Pakistan. All rights reserved.</span>
          <span className="flex gap-6">
            <Link href="/support" className="f-footer__link text-sm">
              Support
            </Link>
            <Link href="/locations" className="f-footer__link text-sm">
              Locations
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
