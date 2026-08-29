import { BRAND } from "@four/shared";
import { BrandLogo } from "../BrandLogo";

export function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-beige">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-center">
        <div>
          <span className="text-red">
            <BrandLogo className="h-8" />
          </span>
          <p className="mt-3 max-w-[40ch] text-sm text-ink-soft">
            Smash burgers and crown crust pizzas. {BRAND.address}.
          </p>
        </div>
        <nav className="grid gap-2 text-sm font-medium text-ink" aria-label="Footer">
          <a href="#menu" className="transition hover:text-red">Menu</a>
          <a href="#story" className="transition hover:text-red">Our Story</a>
          <a href="#visit" className="transition hover:text-red">Visit Us</a>
        </nav>
        <div className="grid gap-2 text-sm text-ink-soft">
          <a href={BRAND.instagram} target="_blank" rel="noopener noreferrer" className="transition hover:text-red">
            Instagram
          </a>
          <a href="https://www.foodpanda.pk/restaurant/lmmc/four" target="_blank" rel="noopener noreferrer" className="transition hover:text-red">
            foodpanda
          </a>
        </div>
      </div>
      <p className="border-t border-ink/10 py-5 text-center text-xs text-ink-soft">
        &copy; {new Date().getFullYear()} FOUR. All prices exclusive of tax. All rights reserved.
      </p>
    </footer>
  );
}
