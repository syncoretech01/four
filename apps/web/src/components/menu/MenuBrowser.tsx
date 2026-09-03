"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useReduceMotion } from "@/lib/useAnim";
import { useKitchenOpen } from "@/lib/useKitchenOpen";
import { DELIVERY_FEE, FREE_DELIVERY_ABOVE, HOURS_LABEL, LAHORE_AREAS, deliveryEtaLabel, formatPKR } from "@four/shared";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { useStore } from "@/lib/store";
import { ItemModal, type MenuItemView } from "./ItemModal";
import { ItemCard } from "./ItemCard";
import { BestsellerShowcase } from "./BestsellerShowcase";
import type { MenuCategoryView } from "./types";

const BESTSELLERS_ID = "bestsellers";

/**
 * The fast-food ordering flow (think McDonald's / KFC web ordering): every
 * category is a section on one long page, navigated by a sticky category
 * rail (mobile) or sidebar (desktop) that scroll-spies the sections. Search
 * collapses the page into a single results grid. Simple items quick-add
 * straight to the cart; anything with sizes or add-ons opens the full picker.
 * On mobile a sticky basket bar keeps the running total one tap from checkout.
 */
export function MenuBrowser() {
  const [categories, setCategories] = useState<MenuCategoryView[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState<string>(BESTSELLERS_ID);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MenuItemView | null>(null);
  const [added, setAdded] = useState<string | null>(null);
  const [serverResults, setServerResults] = useState<MenuItemView[] | null>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const queryRef = useRef(query);
  queryRef.current = query;
  const reduce = useReduceMotion();
  const kitchenOpen = useKitchenOpen();
  const location = useStore((s) => s.location);
  const setLocationModalOpen = useStore((s) => s.setLocationModalOpen);
  const locArea = location ? LAHORE_AREAS.find((a) => a.id === location.areaId) : undefined;

  const load = useCallback(() => {
    setLoading(true);
    setFailed(false);
    api<{ categories: MenuCategoryView[] }>("/api/menu")
      .then((d) => {
        setCategories(d.categories);
        setFailed(d.categories.length === 0);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  const bestsellers = useMemo(
    () => categories.flatMap((c) => c.items.filter((i) => i.available && i.tags.includes("bestseller"))),
    [categories],
  );
  const categoryLabels = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.label])), [categories]);

  const navEntries = useMemo(
    () => [
      ...(bestsellers.length ? [{ id: BESTSELLERS_ID, label: "Best Sellers", count: bestsellers.length }] : []),
      ...categories.map((c) => ({ id: c.id, label: c.label, count: c.items.length })),
    ],
    [categories, bestsellers],
  );

  /**
   * Search flattens the page into one grid; null means "not searching".
   * Two layers: the client substring filter answers within a keystroke and
   * serves when the API is down; the server's alias-aware ranked search
   * ("coke", "crown crust", Roman-Urdu aliases) upgrades it in place.
   */
  const clientResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return categories.flatMap((c) =>
      c.items.filter((i) => i.available && `${i.name} ${i.description} ${c.label}`.toLowerCase().includes(q)),
    );
  }, [categories, query]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setServerResults(null);
      return;
    }
    const t = setTimeout(() => {
      api<{ items: MenuItemView[] }>(`/api/menu/search?q=${encodeURIComponent(q)}&limit=12`)
        .then((d) => {
          // stale guard: apply only if the query hasn't moved on meanwhile
          if (queryRef.current.trim() === q) setServerResults(d.items);
        })
        .catch(() => {}); // client filter silently keeps serving
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const results = query.trim() ? (serverResults ?? clientResults) : null;

  // Scroll-spy: a thin band about a third down the viewport; whichever
  // section crosses it owns the category nav.
  useEffect(() => {
    if (results) return; // sections are unmounted while searching
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-menu-section]"));
    if (sections.length === 0) return;
    const spy = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id.replace("cat-", ""));
      },
      { rootMargin: "-35% 0px -60% 0px" },
    );
    sections.forEach((s) => spy.observe(s));
    return () => spy.disconnect();
  }, [categories, results]);

  // Keep the active chip visible in the mobile rail (manual scrollLeft math -
  // scrollIntoView would also scroll the page).
  useEffect(() => {
    const rail = railRef.current;
    const el = rail?.querySelector<HTMLElement>(`[data-cat="${active}"]`);
    if (rail && el) rail.scrollTo({ left: el.offsetLeft - rail.clientWidth / 2 + el.clientWidth / 2, behavior: reduce ? "auto" : "smooth" });
  }, [active, reduce]);

  // Deep links - the sections only exist after the fetch. `/menu#cat-pizzas`
  // scrolls to a category; `/menu?item=classic-new-york` (deal cards) opens
  // the item picker directly - the meal-deal modifier IS the deal.
  useEffect(() => {
    if (loading) return;
    const itemId = new URLSearchParams(window.location.search).get("item");
    if (itemId) {
      const item = categories.flatMap((c) => c.items).find((i) => i.id === itemId);
      if (item?.available) setSelected(item);
    }
    if (window.location.hash) {
      document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView();
    }
  }, [loading, categories]);

  const jump = (id: string) => {
    setActive(id);
    document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  // simple items (one price, no choices) add straight to the cart; anything
  // with sizes or add-ons opens the full picker instead
  const quickAdd = async (item: MenuItemView) => {
    if (!item.available) return;
    if (item.variants.length > 0 || item.modifierGroups.length > 0) {
      setSelected(item);
      return;
    }
    setAdded(item.id);
    await api("/api/cart/lines", { method: "POST", body: JSON.stringify({ itemId: item.id, qty: 1 }) }).catch(() => {
      setAdded((cur) => (cur === item.id ? null : cur));
      toast.error("Couldn't add that — try again.");
    });
    setTimeout(() => setAdded((cur) => (cur === item.id ? null : cur)), 1300);
  };

  const grid = "grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3";

  return (
    <div className="pb-24 lg:pb-0">
      {/* ── Page header: title + search ── */}
      <header className="wrap pt-[calc(var(--bar-h)+2rem)]">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
          <div>
            <p className="f-eyebrow">Order online</p>
            <h1 className="f-heading f-heading--xl">The Menu</h1>
            <p className="f-lede">Pick a category, stack your order, and we&apos;ll smash it fresh.</p>
          </div>
          <label className="relative block w-full sm:w-80">
            <span className="sr-only">Search the menu</span>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400">
              <circle cx="8.5" cy="8.5" r="6" stroke="currentColor" strokeWidth="2.5" />
              <path d="M13 13l5 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search burgers, pizzas, shakes..."
              className="f-input f-input--search"
            />
          </label>
        </div>

        {/* The honest numbers, before checkout ever asks for them. */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button onClick={() => setLocationModalOpen(true)} className="f-chip f-chip--sm">
            <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden>
              <path d="M6 13S1 8.6 1 5.4a5 5 0 1 1 10 0C11 8.6 6 13 6 13Z" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="6" cy="5.4" r="1.6" fill="currentColor" />
            </svg>
            {location ? `Delivering to ${location.block}, ${location.areaName}` : "Set delivery area for ETA and fee"}
          </button>
          {locArea && <span className="f-tag f-tag--muted">{deliveryEtaLabel(locArea.distanceKm)}</span>}
          <span className="f-tag f-tag--muted">
            {formatPKR(DELIVERY_FEE)} delivery · free over {formatPKR(FREE_DELIVERY_ABOVE)}
          </span>
        </div>

        {!kitchenOpen && (
          <p className="f-notice f-notice--yellow mt-4">
            Kitchen closed · {HOURS_LABEL}. Fill your cart now — ordering opens at 1:00 pm.
          </p>
        )}
      </header>

      {loading ? (
        <div className="wrap band pt-10" aria-busy="true" aria-label="Loading the menu">
          <div className="flex gap-6 overflow-hidden pt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-96 w-72 shrink-0 animate-pulse rounded-card border border-rule bg-beige" />
            ))}
          </div>
          <div className={`mt-12 ${grid}`}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-card border border-rule bg-beige" />
            ))}
          </div>
        </div>
      ) : failed ? (
        <div className="wrap band">
          <div className="f-empty">
            <p className="f-empty__text">The menu could not load. Check your connection and try again.</p>
            <button onClick={load} className="f-btn f-btn--primary f-btn--md">
              Reload the menu
            </button>
          </div>
        </div>
      ) : results ? (
        /* ── Search results ── */
        <div className="wrap pb-24 pt-8">
          <p className="text-sm font-bold uppercase tracking-[0.08em] text-ink-600" aria-live="polite">
            {results.length} {results.length === 1 ? "dish" : "dishes"} for &ldquo;{query.trim()}&rdquo;
          </p>
          {results.length === 0 ? (
            <div className="f-empty mt-10">
              <p className="f-empty__text">Nothing matches. Try &ldquo;burger&rdquo;, &ldquo;crown crust&rdquo; or &ldquo;coke&rdquo;.</p>
              <button onClick={() => setQuery("")} className="f-btn f-btn--outline f-btn--md">
                Clear the search
              </button>
            </div>
          ) : (
            <div className={`mt-8 ${grid}`}>
              {results.map((item, i) => (
                <ItemCard key={item.id} item={item} index={i} added={added === item.id} onOpen={setSelected} onQuickAdd={quickAdd} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* ── Sticky category rail (mobile / tablet) ── */}
          <div className="sticky top-[var(--nav-h-scrolled)] z-30 mt-6 border-b border-rule bg-white/95 backdrop-blur-[10px] lg:hidden">
            <div className="wrap">
              <div ref={railRef} className="f-rail py-2">
                {navEntries.map((c) => (
                  <button key={c.id} data-cat={c.id} onClick={() => jump(c.id)} className={`f-rail__item ${active === c.id ? "is-active" : ""}`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Bestseller portfolio ── */}
          {bestsellers.length > 0 && (
            <section id={`cat-${BESTSELLERS_ID}`} data-menu-section className="mt-2 scroll-mt-[calc(var(--nav-h-scrolled)+3.5rem)] bg-[var(--bg-page-alt)] lg:mt-10 lg:scroll-mt-[calc(var(--nav-h-scrolled)+1rem)]">
              <div className="wrap py-10 lg:py-12">
                <div className="flex items-end justify-between gap-6">
                  <div>
                    <p className="f-eyebrow">The greatest hits</p>
                    <h2 className="f-heading f-heading--lg">Best Sellers</h2>
                  </div>
                  <span className="f-tag f-tag--muted hidden sm:inline-flex">
                    {String(bestsellers.length).padStart(2, "0")} on display
                  </span>
                </div>
                <BestsellerShowcase items={bestsellers} onSelect={setSelected} categoryLabels={categoryLabels} />
              </div>
            </section>
          )}

          {/* ── Category sections + sticky sidebar ── */}
          <div className="wrap pb-24 lg:grid lg:grid-cols-[14rem_1fr] lg:gap-12">
            <aside className="hidden lg:block">
              <nav className="f-catnav sticky top-[calc(var(--nav-h-scrolled)+1.5rem)] max-h-[calc(100dvh-7rem)] overflow-y-auto" aria-label="Menu categories">
                {navEntries.map((c) => (
                  <button key={c.id} onClick={() => jump(c.id)} className={`f-catnav__item ${active === c.id ? "is-active" : ""}`}>
                    {c.label}
                    <span className="f-catnav__count">{c.count}</span>
                  </button>
                ))}
              </nav>
            </aside>

            <div>
              {categories.map((c) => (
                <section key={c.id} id={`cat-${c.id}`} data-menu-section className="scroll-mt-[calc(var(--nav-h-scrolled)+3.5rem)] pt-12 first:pt-10 lg:scroll-mt-[calc(var(--nav-h-scrolled)+1rem)] lg:first:pt-12">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <h2 className="f-heading f-heading--md">{c.label}</h2>
                    <p className="text-sm font-semibold text-ink-600">{c.blurb}</p>
                  </div>
                  <div className={`mt-6 ${grid}`}>
                    {c.items.map((item, i) => (
                      <ItemCard key={item.id} item={item} index={i} added={added === item.id} onOpen={setSelected} onQuickAdd={quickAdd} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </>
      )}

      <ItemModal item={selected} onClose={() => setSelected(null)} />
      <BasketBar />
    </div>
  );
}

/**
 * Mobile-only sticky footer bar with the running basket total - the KFC
 * "View basket" pattern. Desktop already has the cart button in the nav.
 * Right padding leaves the corner clear for the chat dock's bubble.
 */
function BasketBar() {
  const cart = useStore((s) => s.cart);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const reduce = useReduceMotion();

  return (
    <AnimatePresence>
      {cart.itemCount > 0 && (
        <motion.div
          initial={reduce ? false : { y: 96 }}
          animate={{ y: 0 }}
          exit={{ y: 96 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-white/95 px-4 py-3 backdrop-blur-[10px] [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
        >
          <button onClick={() => setCartOpen(true)} className="f-btn f-btn--primary f-btn--lg f-btn--block justify-between px-5">
            <span className="inline-flex items-center gap-2 whitespace-nowrap">
              View basket
              <span className="f-tag f-tag--count">{cart.itemCount}</span>
            </span>
            <span className="whitespace-nowrap">{formatPKR(cart.subtotal)}</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
