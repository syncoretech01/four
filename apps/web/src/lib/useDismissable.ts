"use client";

import { useEffect } from "react";

/**
 * Escape-to-close + body scroll lock for any open overlay. One shared hook
 * so every dialog (item modal, location modal, cart drawer, mobile nav)
 * behaves identically.
 */
export function useDismissable(open: boolean, onClose: () => void): void {
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
}
