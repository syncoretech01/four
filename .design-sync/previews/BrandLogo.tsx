import { BrandLogo } from "@four/ui";

/* The wordmark takes currentColor, so every story is really a colour-context story. */

/** Red on the beige ground - how the wordmark appears in the storefront nav. */
export const OnBeige = () => (
  <div className="flex items-center justify-center bg-beige px-10 py-14">
    <span className="text-red">
      <BrandLogo className="h-14" />
    </span>
  </div>
);

/** Cream on ink - the inverted surface used by the Visit panel. */
export const OnInk = () => (
  <div className="flex items-center justify-center bg-ink px-10 py-14">
    <span className="text-cream">
      <BrandLogo className="h-14" />
    </span>
  </div>
);

/** Cream on red - the loudest pairing, used on full-bleed brand bands. */
export const OnRed = () => (
  <div className="flex items-center justify-center bg-red px-10 py-14">
    <span className="text-cream">
      <BrandLogo className="h-14" />
    </span>
  </div>
);

/** Set height only and let the width follow. h-7 is nav size, h-8 footer size. */
export const Sizes = () => (
  <div className="flex flex-wrap items-end justify-center gap-10 bg-beige px-10 py-14 text-red">
    <span className="flex flex-col items-center gap-3">
      <BrandLogo className="h-6" />
      <code className="text-xs text-ink-soft">h-6</code>
    </span>
    <span className="flex flex-col items-center gap-3">
      <BrandLogo className="h-8" />
      <code className="text-xs text-ink-soft">h-8</code>
    </span>
    <span className="flex flex-col items-center gap-3">
      <BrandLogo className="h-12" />
      <code className="text-xs text-ink-soft">h-12</code>
    </span>
  </div>
);
