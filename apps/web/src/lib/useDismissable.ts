"use client";

import { useEffect, useRef } from "react";

/**
 * Escape-to-close + body scroll lock for any open overlay. One shared hook
 * so every dialog (item modal, location modal, cart drawer, mobile nav)
 * behaves identically.
 *
 * Dialogs genuinely stack — CartDrawer renders ItemModal to edit a line, so two
 * are open at once — which the previous per-dialog listeners got wrong twice:
 * one Escape closed the picker *and* the drawer behind it, and closing the
 * picker ran `overflow = ""`, unlocking the page while the drawer was still
 * open. A module-level stack fixes both: only the TOP dialog answers Escape,
 * and the lock lifts only when the last one closes.
 */
const stack: Array<() => void> = [];

function handleKey(e: KeyboardEvent): void {
  if (e.key !== "Escape") return;
  stack[stack.length - 1]?.();
}

function push(close: () => void): void {
  stack.push(close);
  if (stack.length === 1) {
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
  }
}

function pop(close: () => void): void {
  const i = stack.lastIndexOf(close);
  if (i !== -1) stack.splice(i, 1);
  if (stack.length === 0) {
    window.removeEventListener("keydown", handleKey);
    document.body.style.overflow = "";
  }
}

export function useDismissable(open: boolean, onClose: () => void): void {
  // Held in a ref so a caller passing an inline arrow does not tear down and
  // re-push on every render, which would silently reorder the stack.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const close = () => closeRef.current();
    push(close);
    return () => pop(close);
  }, [open]);
}
