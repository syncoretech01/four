"use client";

import { BRAND } from "@four/shared";

/**
 * Root error boundary. Renders standalone (no Nav/Footer) so a broken
 * dependency can never take the recovery screen down with it.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="flex min-h-[100dvh] items-center justify-center bg-paper-100 px-4">
      <div className="f-card f-card--pad-lg f-empty max-w-lg">
        <h1 className="f-heading f-heading--md">Something burned in the kitchen</h1>
        <p className="f-empty__text">An unexpected error stopped this page. Your cart is safe.</p>
        <button onClick={reset} className="f-btn f-btn--primary f-btn--md">
          Try again
        </button>
        <p className="text-sm text-ink-600">
          Still stuck? Call{" "}
          <a href={BRAND.phoneHref} className="font-extrabold">
            {BRAND.phone}
          </a>
        </p>
      </div>
    </main>
  );
}
