"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { LAHORE_AREAS, findArea } from "@/data/locations";
import { useStore } from "@/lib/store";
import { BrandLogo } from "./BrandLogo";

/**
 * First-visit popup: pick a Lahore area, then a block within it, to start
 * an online order. The X (or Escape / backdrop click) closes it so people
 * can browse the site freely; the nav chip re-opens it any time.
 */
export function LocationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const setLocation = useStore((s) => s.setLocation);
  const current = useStore((s) => s.location);
  const [areaId, setAreaId] = useState(current?.areaId ?? "");
  const [block, setBlock] = useState(current?.block ?? "");
  const reduce = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);

  const area = useMemo(() => (areaId ? findArea(areaId) : undefined), [areaId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const confirm = () => {
    if (!area || !block) return;
    setLocation({ areaId: area.id, areaName: area.name, block });
    onClose();
    document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="location-title"
            className="relative w-full max-w-lg rounded-t-card bg-cream p-8 shadow-2xl shadow-ink/30 sm:rounded-card"
            initial={reduce ? false : { y: 48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { y: 48, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
          >
            <button
              onClick={onClose}
              aria-label="Close and browse the website"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition hover:bg-beige-deep hover:text-ink active:scale-95"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <BrandLogo className="h-8" />
            <h2 id="location-title" className="font-display mt-5 text-3xl leading-tight text-ink">
              Where should we deliver?
            </h2>
            <p className="mt-2 max-w-[40ch] text-sm text-ink-soft">
              Pick your area in Lahore and we will route your order to the nearest FOUR kitchen.
            </p>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink">Area</span>
                <select
                  value={areaId}
                  onChange={(e) => {
                    setAreaId(e.target.value);
                    setBlock("");
                  }}
                  className="h-12 rounded-xl border border-ink/15 bg-cream px-4 text-ink outline-none transition focus:border-red focus:ring-2 focus:ring-red/30"
                >
                  <option value="" disabled>
                    Select your area
                  </option>
                  {LAHORE_AREAS.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink">Block / Sector</span>
                <select
                  value={block}
                  onChange={(e) => setBlock(e.target.value)}
                  disabled={!area}
                  className="h-12 rounded-xl border border-ink/15 bg-cream px-4 text-ink outline-none transition focus:border-red focus:ring-2 focus:ring-red/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" disabled>
                    {area ? `Select a block in ${area.name}` : "Choose an area first"}
                  </option>
                  {area?.blocks.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </label>

              <button
                onClick={confirm}
                disabled={!area || !block}
                className="mt-2 h-13 rounded-full bg-red px-8 py-4 font-semibold text-cream transition hover:bg-red-deep active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Order online
              </button>
              <button onClick={onClose} className="text-sm font-medium text-ink-soft underline-offset-4 transition hover:text-ink hover:underline">
                Just browsing? Explore the website
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Mounts the popup on first visit until a location is chosen or it is dismissed. */
export function LocationGate() {
  const location = useStore((s) => s.location);
  const dismissed = useStore((s) => s.locationDismissed);
  const dismiss = useStore((s) => s.dismissLocation);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // wait for zustand persist to rehydrate before deciding to pop
    const t = setTimeout(() => setHydrated(true), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (hydrated && !location && !dismissed) setOpen(true);
  }, [hydrated, location, dismissed]);

  return (
    <LocationModal
      open={open}
      onClose={() => {
        setOpen(false);
        dismiss();
      }}
    />
  );
}
