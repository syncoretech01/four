"use client";

import { useEffect, useState } from "react";
import { isOpenAt } from "@four/shared";

/**
 * Mirrors the server's opening-hours rule (the API refuses orders outside
 * hours), refreshed every minute so a session that crosses 1pm or 3am
 * updates without a reload.
 */
export function useKitchenOpen(): boolean {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const tick = () => setOpen(isOpenAt());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);
  return open;
}
