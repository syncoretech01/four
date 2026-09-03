"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MENU_CATEGORIES, MENU_ITEMS } from "@four/shared";
import { useReduceMotion } from "@/lib/useAnim";
import { SmartImage } from "../SmartImage";
import { SectionHeader } from "../ds/SectionHeader";

/**
 * Which dish photo fronts each category circle. None of these is tagged
 * "bestseller", so a circle never repeats a Popular Dishes card on the same
 * page; the dev-only assert below guards that against menu-data drift.
 */
const CATEGORY_HERO_ITEM: Record<string, string> = {
  "smash-burgers": "london-bbq",
  "chicken-burgers": "cairo-chipotle",
  wings: "masala-wings",
  wraps: "bangkok-chipotle-wrap",
  fries: "lahori-fries",
  pizzas: "malai-boti-crown-red",
  calzones: "malai-boti-calzone",
  drinks: "cola",
  "fizz-chillers": "mango-fizz",
  shakes: "toffee-shake",
  desserts: "brownie-cheesecake",
};

if (process.env.NODE_ENV !== "production") {
  for (const id of Object.values(CATEGORY_HERO_ITEM)) {
    console.assert(!MENU_ITEMS.find((i) => i.id === id)?.tags?.includes("bestseller"), `${id} is a bestseller`);
  }
}

function thumbFor(categoryId: string): { src: string; name: string } {
  const id = CATEGORY_HERO_ITEM[categoryId] ?? MENU_ITEMS.find((i) => i.category === categoryId)?.id ?? "";
  const item = MENU_ITEMS.find((i) => i.id === id);
  return { src: item?.image ?? `/menu-items/${id}.jpg`, name: item?.name ?? "" };
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d={dir === "left" ? "M19 12H5M11 6l-6 6 6 6" : "M5 12h14M13 6l6 6-6 6"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Dinevo's circular category carousel: round photo thumbs with Anton labels,
 * round prev/next buttons, a hairline progress bar. `mode="link"` (home) deep
 * links to `/menu#cat-<id>`; `mode="jump"` (menu page) scrolls the matching
 * section through the caller's `onJump`.
 */
export function CategoriesCarousel({
  mode = "link",
  onJump,
  className = "",
}: {
  mode?: "link" | "jump";
  onJump?: (id: string) => void;
  className?: string;
}) {
  const reduce = useReduceMotion();
  const railRef = useRef<HTMLUListElement>(null);
  const [progress, setProgress] = useState(0.25);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setProgress(max > 0 ? (el.scrollLeft + el.clientWidth) / el.scrollWidth : 1);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const page = (dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section className={`band ${className}`.trim()} aria-label="Menu categories">
      <div className="wrap">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeader title="What are you craving?" highlight="craving" tag="The menu" tag2="Dig in" />
          <div className="flex gap-1.5">
            <button type="button" onClick={() => page(-1)} aria-label="Previous categories" className="f-iconbtn f-iconbtn--lg">
              <Chevron dir="left" />
            </button>
            <button type="button" onClick={() => page(1)} aria-label="Next categories" className="f-iconbtn f-iconbtn--lg">
              <Chevron dir="right" />
            </button>
          </div>
        </div>

        <ul
          role="list"
          ref={railRef}
          className="mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {MENU_CATEGORIES.map((c) => {
            const thumb = thumbFor(c.id);
            const inner = (
              <>
                <div className="f-circ">
                  <SmartImage src={thumb.src} alt="" fallbackLabel={c.label} className="h-full w-full" />
                </div>
                <span className="f-heading f-heading--sm block text-center">{c.label}</span>
              </>
            );
            return (
              <li key={c.id} className="w-[70%] shrink-0 snap-start sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                {mode === "link" ? (
                  <Link href={`/menu#cat-${c.id}`} className="block" aria-label={`${c.label} — see the menu`}>
                    {inner}
                  </Link>
                ) : (
                  <button type="button" onClick={() => onJump?.(c.id)} className="block w-full" aria-label={`Jump to ${c.label}`}>
                    {inner}
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-8 h-px w-full bg-rule" aria-hidden>
          <div className="h-px bg-red transition-[width] duration-300" style={{ width: `${Math.round(Math.min(1, Math.max(0.1, progress)) * 100)}%` }} />
        </div>
      </div>
    </section>
  );
}
