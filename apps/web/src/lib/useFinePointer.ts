"use client";

import { useEffect, useState } from "react";

/**
 * True when the visitor has a precise pointer (a mouse or trackpad).
 *
 * Hydration-safe in the same way as `useReduceMotion`: it reports `false` until
 * a mount effect runs, so the server and the first client render agree. That
 * default is the right one here — cursor-following effects start off and switch
 * on once we know there is a cursor, rather than briefly assuming one.
 */
export function useFinePointer(): boolean {
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    setFine(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setFine(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return fine;
}
