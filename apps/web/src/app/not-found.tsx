import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/sections/Footer";
import { StickerTag } from "@/components/ds/StickerTag";
import { PillCta } from "@/components/ds/PillCta";

export default function NotFound() {
  return (
    <>
      <Nav />
      <main id="main" className="flex min-h-[calc(100dvh-var(--bar-h))] items-center justify-center bg-white px-4 pb-16 pt-[var(--bar-h)] sm:px-6">
        <div className="f-empty max-w-xl">
          <div className="relative inline-block">
            <StickerTag tilt="left" className="absolute -left-6 -top-3">
              Oops
            </StickerTag>
            <p className="font-display text-[clamp(120px,22vw,220px)] leading-none text-red" aria-hidden>
              4<span className="text-pink">0</span>4
            </p>
            <StickerTag tone="pink" tilt="right" className="absolute -right-8 bottom-2">
              Lost the sauce
            </StickerTag>
          </div>
          <h1 className="f-heading f-heading--sm">Page Not Found</h1>
          <p className="f-empty__text">That page doesn&apos;t exist — the food definitely does.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <PillCta href="/" tone="red">
              Back to home
            </PillCta>
            <Link href="/menu" className="f-btn f-btn--quiet">
              See the menu
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
