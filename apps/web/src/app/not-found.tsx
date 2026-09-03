import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/sections/Footer";
import { HAND_MARK } from "@/components/hero/logoPaths";

export default function NotFound() {
  return (
    <>
      <Nav />
      <main id="main" className="mx-auto flex min-h-[calc(100dvh-var(--bar-h))] max-w-7xl items-center justify-center px-4 pb-16 pt-[calc(var(--bar-h)+2rem)] sm:px-6">
        <div className="f-empty max-w-xl">
          <svg viewBox="180 100 700 900" className="f-empty__glyph text-red" aria-hidden>
            <g transform={HAND_MARK.transform}>
              <path d={HAND_MARK.d} fill="currentColor" />
            </g>
          </svg>
          <h1 className="f-heading f-heading--lg">Lost the sauce</h1>
          <p className="f-empty__text">That page doesn&apos;t exist — the food definitely does.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/menu" className="f-btn f-btn--primary f-btn--md">
              See the menu
            </Link>
            <Link href="/" className="f-btn f-btn--quiet f-btn--sm">
              Back home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
