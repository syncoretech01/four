"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useReduceMotion } from "@/lib/useAnim";
import { useDismissable } from "@/lib/useDismissable";
import { useKitchenOpen } from "@/lib/useKitchenOpen";
import {
  LAHORE_AREAS,
  DELIVERY_FEE,
  FREE_DELIVERY_ABOVE,
  deliveryEtaLabel,
  branchForArea,
  formatPKR,
} from "@four/shared";
import { useStore } from "@/lib/store";
import { BrandLogo } from "./BrandLogo";

/**
 * Order-online popup: pick a Lahore area, then a block within it. As soon as
 * an area is chosen the honest numbers appear - ETA for that area, the
 * delivery fee and free threshold, and which kitchen will cook - so nothing
 * is a surprise at checkout. The X (or Escape / backdrop) closes it so
 * visitors can browse freely; the nav chip re-opens it any time.
 *
 * `areaIds` / `initialAreaId` let the locations page scope the picker to one
 * branch ("Fairways delivers to these areas") - routing stays area-driven
 * either way, so the scoped picker can never mis-route an order.
 */
export function LocationModal({
  open,
  onClose,
  areaIds,
  initialAreaId,
  intro,
}: {
  open: boolean;
  onClose: () => void;
  areaIds?: string[];
  initialAreaId?: string;
  intro?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const setLocation = useStore((s) => s.setLocation);
  const current = useStore((s) => s.location);
  const [areaId, setAreaId] = useState(initialAreaId ?? current?.areaId ?? "");
  const [block, setBlock] = useState(current?.block ?? "");
  const reduce = useReduceMotion();
  const kitchenOpen = useKitchenOpen();

  const areas = useMemo(
    () => (areaIds ? LAHORE_AREAS.filter((a) => areaIds.includes(a.id)) : LAHORE_AREAS),
    [areaIds],
  );
  const area = useMemo(() => areas.find((a) => a.id === areaId), [areas, areaId]);

  useDismissable(open, onClose);

  // a fresh initialAreaId (e.g. tapping a different area chip on /locations)
  // re-seeds the picker next time it opens
  useEffect(() => {
    if (open && initialAreaId) {
      setAreaId(initialAreaId);
      setBlock("");
    }
  }, [open, initialAreaId]);

  const confirm = () => {
    if (!area || !block) return;
    setLocation({ areaId: area.id, areaName: area.name, block });
    onClose();
    const menuAnchor = document.getElementById("menu");
    if (menuAnchor) menuAnchor.scrollIntoView({ behavior: "smooth" });
    else if (pathname !== "/menu") router.push("/menu");
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
              {intro ?? "Pick your area in Lahore and we'll route your order to the nearest FOUR kitchen."}
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
                  {areas.map((a) => (
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

              {/* The honest numbers for the chosen area - what checkout will
                  actually say, sourced from the same shared constants. */}
              <AnimatePresence initial={false}>
                {area && (
                  <motion.div
                    initial={reduce ? false : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    className="overflow-hidden"
                  >
                    <div className="f-card f-card--flat grid gap-2.5 p-4 text-sm font-semibold text-ink-900">
                      <span className="flex items-center gap-2.5">
                        <DetailIcon name="clock" />
                        Delivery in about {deliveryEtaLabel(area.distanceKm)}
                      </span>
                      <span className="flex items-center gap-2.5">
                        <DetailIcon name="van" />
                        {formatPKR(DELIVERY_FEE)} delivery · free over {formatPKR(FREE_DELIVERY_ABOVE)}
                      </span>
                      <span className="flex items-center gap-2.5">
                        <DetailIcon name="pan" />
                        Cooked at FOUR {branchForArea(area.id).shortName}
                      </span>
                      <span className="flex items-center gap-2.5 text-ink-600">
                        <span className={`f-dot ${kitchenOpen ? "" : "f-dot--off"}`} aria-hidden>
                          {kitchenOpen && <span className="f-dot__ping" />}
                          <span className="f-dot__core" />
                        </span>
                        {kitchenOpen
                          ? "Open now · delivering till 3:00 am"
                          : "Kitchen opens at 1:00 pm — browse and fill your cart now"}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={confirm}
                disabled={!area || !block}
                className="f-btn f-btn--primary f-btn--lg f-btn--block mt-2"
              >
                {area && block ? `Deliver here · ${deliveryEtaLabel(area.distanceKm)}` : "Order online"}
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

function DetailIcon({ name }: { name: "clock" | "van" | "pan" }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0 text-red">
      {name === "clock" && (
        <>
          <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 4.8V8l2.2 1.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
      {name === "van" && (
        <>
          <path d="M1.5 4.5h8v7h-8zM9.5 7h3l2 2.2v2.3h-5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="4.5" cy="12.4" r="1.4" fill="currentColor" />
          <circle cx="11.8" cy="12.4" r="1.4" fill="currentColor" />
        </>
      )}
      {name === "pan" && (
        <>
          <circle cx="7" cy="8.5" r="4.75" stroke="currentColor" strokeWidth="1.8" />
          <path d="M11.5 6.5 15 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
    </svg>
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
