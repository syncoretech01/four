"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useReduceMotion } from "@/lib/useAnim";
import { LAHORE_AREAS } from "@four/shared";
import { useStore } from "@/lib/store";
import { BrandLogo } from "./BrandLogo";

/**
 * Order-online popup: pick a Lahore area, then a block within it. The X
 * (or Escape / backdrop) closes it so visitors can browse freely; the nav
 * chip re-opens it any time.
 */
export function LocationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const setLocation = useStore((s) => s.setLocation);
  const current = useStore((s) => s.location);
  const [areaId, setAreaId] = useState(current?.areaId ?? "");
  const [block, setBlock] = useState(current?.block ?? "");
  const reduce = useReduceMotion();

  const area = useMemo(() => LAHORE_AREAS.find((a) => a.id === areaId), [areaId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
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
          className="f-modal__wrap f-modal__wrap--sheet sm:!items-center sm:!p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="f-scrim" onClick={onClose} aria-hidden />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="location-title"
            className="f-modal max-w-lg p-8"
            initial={reduce ? false : { y: 48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { y: 48, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
          >
            <button
              onClick={onClose}
              aria-label="Close and browse the website"
              className="f-modal__close f-iconbtn f-iconbtn--sm f-iconbtn--plain"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <span className="text-red">
              <BrandLogo className="h-8" />
            </span>
            <h2 id="location-title" className="f-heading f-heading--md mt-5">
              Where should we deliver?
            </h2>
            <p className="mt-2 max-w-[40ch] text-sm text-ink-600">
              Pick your area in Lahore and we&apos;ll route your order to the FOUR kitchen.
            </p>

            <div className="mt-6 grid gap-4">
              <label className="f-field">
                <span className="f-field__label">Area</span>
                <select
                  value={areaId}
                  onChange={(e) => {
                    setAreaId(e.target.value);
                    setBlock("");
                  }}
                  className="f-input f-select"
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

              <label className="f-field">
                <span className="f-field__label">Block / Sector</span>
                <select
                  value={block}
                  onChange={(e) => setBlock(e.target.value)}
                  disabled={!area}
                  className="f-input f-select"
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
                className="f-btn f-btn--primary f-btn--lg f-btn--block mt-2"
              >
                Order online
              </button>
              <button onClick={onClose} className="f-btn f-btn--quiet f-btn--sm">
                Just browsing? Explore the website
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Pops on first visit until a location is chosen or dismissed. */
export function LocationGate() {
  const location = useStore((s) => s.location);
  const dismissed = useStore((s) => s.locationDismissed);
  const dismiss = useStore((s) => s.dismissLocation);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      const { location: loc, locationDismissed } = useStore.getState();
      if (!loc && !locationDismissed) setOpen(true);
    }, 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (location || dismissed) setOpen(false);
  }, [location, dismissed]);

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
