"use client";

import { BRAND } from "@four/shared";
import { StickerTag } from "@/components/ds/StickerTag";

/**
 * Root error boundary. Renders standalone (no Nav/Footer) so a broken
 * dependency can never take the recovery screen down with it.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="flex min-h-[100dvh] items-center justify-center bg-white px-4">
      <div className="f-card f-card--pad-lg f-empty max-w-lg">
        <StickerTag tilt="left">Oops</StickerTag>
        <h1 className="f-heading f-heading--md">Something Burned in the Kitchen</h1>
        <p className="f-empty__text">An unexpected error stopped this page. Your cart is safe.</p>
        <button onClick={reset} className="f-btn f-btn--red f-btn--md">
          Try again
        </button>
        <p className="text-sm text-ink-600">
          Still stuck? Call{" "}
          <a href={BRAND.phoneHref} className="font-bold text-red">
            {BRAND.phone}
          </a>
        </p>
      </div>
    </main>
  );
}
