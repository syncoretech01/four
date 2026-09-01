"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useScroll, useMotionValueEvent } from "motion/react";
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

/**
 * `overlay` is for pages whose first section is a dark full-bleed hero (the
 * home video). Before the bar lands it goes fully transparent with cream
 * marks, so the footage runs clean to the top edge instead of under a pale
 * translucent band.
 */
export function Nav({ overlay = false }: { overlay?: boolean } = {}) {
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

  const onDark = overlay && !scrolled;

  return (
    <>
      {/* Past 24px the bar lands: paper ground, 10px blur, the 2px ink rule. */}
      <header
        className={`fixed inset-x-0 top-0 z-40 border-b-2 transition-all duration-[250ms] ${
          scrolled
            ? "border-ink-900 bg-paper-100/90 backdrop-blur-[10px]"
            : onDark
              ? "border-transparent bg-transparent"
              : "border-transparent bg-paper-100/40 backdrop-blur-sm"
        }`}
      >
        <nav
          aria-label="Primary"
          className={`mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 transition-all duration-[250ms] sm:px-6 ${
            scrolled ? "h-14" : "h-16"
          }`}
        >
          {/* `!` because the DS ships an unlayered `a { color: var(--link) }`,
              which outranks Tailwind's layered colour utilities. */}
          <Link href="/" aria-label="FOUR home" className={`shrink-0 transition-colors ${onDark ? "!text-paper-0" : "!text-red"}`}>
            <BrandLogo className="h-7" />
          </Link>

          <div
            className={`hidden items-center gap-6 text-sm font-bold uppercase tracking-[0.04em] md:flex lg:gap-7 ${
              onDark ? "[text-shadow:0_1px_10px_rgba(34,25,19,0.7)]" : ""
            }`}
          >
            {NAV_LINKS.map((l) => {
              const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`border-b-2 pb-0.5 transition ${
                    onDark
                      ? `!text-paper-0 hover:!text-paper-0/70 ${active ? "border-paper-0" : "border-transparent"}`
                      : active
                        ? "border-ink-900 !text-red"
                        : "border-transparent !text-ink-900 hover:!text-red"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLocOpen(true)}
              data-open-location
              className="f-chip f-chip--sm !hidden max-w-52 sm:!inline-flex"
            >
              <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden>
                <path d="M6 13S1 8.6 1 5.4a5 5 0 1 1 10 0C11 8.6 6 13 6 13Z" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="6" cy="5.4" r="1.6" fill="currentColor" />
              </svg>
              <span className="truncate">{location ? `${location.block}, ${location.areaName}` : "Set delivery area"}</span>
            </button>

            <button
              onClick={() => setCartOpen(true)}
              aria-label={`Open cart, ${cart.itemCount} items`}
              className="f-btn f-btn--primary f-btn--sm"
            >
              Cart
              {cart.itemCount > 0 && <span className="f-badge f-badge--count">{cart.itemCount}</span>}
            </button>

            <button
              ref={burgerRef}
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              className="f-iconbtn f-iconbtn--sm md:!hidden"
            >
              <svg width="16" height="14" viewBox="0 0 16 14" fill="none" aria-hidden>
                <path d="M1 1h14M1 7h14M1 13h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </nav>
      </header>
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} links={MOBILE_LINKS} returnFocusTo={burgerRef} />
      <LocationModal open={locOpen} onClose={() => setLocOpen(false)} />
    </>
  );
}
