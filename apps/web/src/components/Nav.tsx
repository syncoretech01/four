"use client";

import { useEffect, useState } from "react";
import { useStore, wireCart } from "@/lib/store";
import { BrandLogo } from "./BrandLogo";
import { LocationModal } from "./LocationModal";

export function Nav() {
  const location = useStore((s) => s.location);
  const cart = useStore((s) => s.cart);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const [locOpen, setLocOpen] = useState(false);

  useEffect(() => wireCart(), []);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-ink/10 bg-beige/85 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <a href="#top" aria-label="FOUR home" className="shrink-0 text-red">
            <BrandLogo className="h-7" />
          </a>

          <div className="hidden items-center gap-7 text-sm font-medium text-ink md:flex">
            <a href="/#menu" className="transition hover:text-red">Menu</a>
            <a href="/#story" className="transition hover:text-red">Our Story</a>
            <a href="/#visit" className="transition hover:text-red">Visit Us</a>
            <a href="/orders" className="transition hover:text-red">My Orders</a>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLocOpen(true)}
              data-open-location
              className="hidden max-w-52 items-center gap-2 truncate rounded-full border border-ink/15 px-4 py-2 text-xs font-medium text-ink transition hover:border-red hover:text-red sm:flex"
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
              className="relative flex h-10 items-center gap-2 rounded-full bg-red px-5 text-sm font-semibold text-cream transition hover:bg-red-deep active:scale-[0.98]"
            >
              Cart
              {cart.itemCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-cream px-1 text-[11px] font-bold text-red">
                  {cart.itemCount}
                </span>
              )}
            </button>
          </div>
        </nav>
      </header>
      <LocationModal open={locOpen} onClose={() => setLocOpen(false)} />
    </>
  );
}
