"use client";

import { useEffect, useState } from "react";
import { useScroll, useMotionValueEvent } from "motion/react";
import { useStore, wireCart } from "@/lib/store";
import { BrandLogo } from "./BrandLogo";
import { LocationModal } from "./LocationModal";

export function Nav() {
  const location = useStore((s) => s.location);
  const cart = useStore((s) => s.cart);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const [locOpen, setLocOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 24));

  useEffect(() => wireCart(), []);

  return (
    <>
      {/* Past 24px the bar lands: paper ground, 10px blur, the 2px ink rule. */}
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-[250ms] ${
          scrolled
            ? "border-b-2 border-ink-900 bg-paper-100/90 backdrop-blur-[10px]"
            : "border-b-2 border-transparent bg-paper-100/40 backdrop-blur-sm"
        }`}
      >
        <nav
          className={`mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 transition-all duration-[250ms] sm:px-6 ${
            scrolled ? "h-14" : "h-16"
          }`}
        >
          <a href="#top" aria-label="FOUR home" className="shrink-0 text-red">
            <BrandLogo className="h-7" />
          </a>

          <div className="hidden items-center gap-7 text-sm font-bold uppercase tracking-[0.04em] text-ink-900 md:flex">
            <a href="/#menu" className="transition hover:text-red">Menu</a>
            <a href="/#story" className="transition hover:text-red">Our Story</a>
            <a href="/#visit" className="transition hover:text-red">Visit Us</a>
            <a href="/orders" className="transition hover:text-red">My Orders</a>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLocOpen(true)}
              data-open-location
              className="f-chip f-chip--sm hidden max-w-52 sm:inline-flex"
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
          </div>
        </nav>
      </header>
      <LocationModal open={locOpen} onClose={() => setLocOpen(false)} />
    </>
  );
}
