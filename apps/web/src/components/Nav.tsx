"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useScroll, useMotionValueEvent } from "motion/react";
import { FREE_DELIVERY_ABOVE, HOURS_LABEL, formatPKR } from "@four/shared";
import { useStore, wireCart } from "@/lib/store";
import { BrandLogo } from "./BrandLogo";
import { LocationModal } from "./LocationModal";
import { MobileNav } from "./nav/MobileNav";

const NAV_LINKS = [
  { href: "/menu", label: "Menu" },
  { href: "/deals", label: "Deals" },
  { href: "/locations", label: "Locations" },
  { href: "/about", label: "Our Food" },
  { href: "/support", label: "Support" },
];

// My Orders lives in the sheet (and the footer) - five primary links is the
// chain pattern; six crowds the bar.
const MOBILE_LINKS = [...NAV_LINKS, { href: "/orders", label: "My Orders" }];

function BagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 8h14l-1 12H6L5 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden className="shrink-0">
      <path d="M6 13S1 8.6 1 5.4a5 5 0 1 1 10 0C11 8.6 6 13 6 13Z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="6" cy="5.4" r="1.6" fill="currentColor" />
    </svg>
  );
}

/**
 * The fixed chrome on every route: a yellow promo strip of real facts that
 * collapses on scroll, then the red bar - white wordmark, yellow links, the
 * delivery-area pill, the cart, the hamburger. Every page opens with a red
 * band, so the bar is always on red; there is no overlay or translucent state.
 */
export function Nav() {
  const pathname = usePathname();
  const location = useStore((s) => s.location);
  const cart = useStore((s) => s.cart);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const locOpen = useStore((s) => s.locationModalOpen);
  const setLocOpen = useStore((s) => s.setLocationModalOpen);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 24));

  useEffect(() => wireCart(), []);

  const cartLabel = `Open cart, ${cart.itemCount} items`;
  const count = cart.itemCount > 0 && <span className="f-tag f-tag--count f-nav__count">{cart.itemCount}</span>;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40">
        <p className={`f-promo ${scrolled ? "is-collapsed" : ""}`} aria-hidden={scrolled || undefined}>
          Free delivery over {formatPKR(FREE_DELIVERY_ABOVE)}
          <span className="hidden sm:inline">&nbsp;· {HOURS_LABEL}</span>
        </p>
        <nav aria-label="Primary" className={`f-nav ${scrolled ? "is-scrolled" : ""}`}>
          <div className="wrap grid h-full grid-cols-[1fr_auto_1fr] items-center gap-4 md:flex md:justify-between">
            {/* phones: cart left, wordmark centred, hamburger right */}
            <div className="flex items-center md:hidden">
              <button onClick={() => setCartOpen(true)} aria-label={cartLabel} className="f-iconbtn f-iconbtn--md f-iconbtn--on-red relative">
                <BagIcon />
                {count}
              </button>
            </div>

            <Link href="/" aria-label="FOUR home" className="justify-self-center text-white md:justify-self-start">
              <BrandLogo className="h-7" />
            </Link>

            <div className="hidden items-center gap-7 md:flex lg:gap-10">
              {NAV_LINKS.map((l) => {
                const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
                return (
                  <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined} className="f-nav__link">
                    {l.label}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setLocOpen(true)} data-open-location className="f-btn f-btn--on-red f-btn--sm hidden max-w-52 sm:inline-flex">
                <PinIcon />
                <span className="truncate">{location ? `${location.block}, ${location.areaName}` : "Set delivery area"}</span>
              </button>

              <button onClick={() => setCartOpen(true)} aria-label={cartLabel} className="f-iconbtn f-iconbtn--md f-iconbtn--on-red relative hidden md:inline-flex">
                <BagIcon />
                {count}
              </button>

              <button
                ref={burgerRef}
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                aria-expanded={mobileOpen}
                aria-controls="mobile-nav"
                className="f-iconbtn f-iconbtn--md f-iconbtn--on-red md:hidden"
              >
                <svg width="16" height="14" viewBox="0 0 16 14" fill="none" aria-hidden>
                  <path d="M1 1h14M1 7h14M1 13h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        </nav>
      </header>
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} links={MOBILE_LINKS} returnFocusTo={burgerRef} />
      <LocationModal open={locOpen} onClose={() => setLocOpen(false)} />
    </>
  );
}
