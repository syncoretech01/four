"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Renders the exact brand logo from /public/brand when the files are
 * present (drop them in from the brand kit; see public/brand/README.md).
 * Until then it falls back to a typographic wordmark in the display face
 * so nothing on the page ever shows a broken image. The mount-time
 * naturalWidth check catches loads that failed before hydration, where
 * onError never reaches the React handler.
 */
export function BrandLogo({ className = "h-9", variant = "full" }: { className?: string; variant?: "full" | "mark" }) {
  const [missing, setMissing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const src = variant === "mark" ? "/brand/logomark.svg" : "/brand/logo.svg";

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setMissing(true);
  }, []);

  if (missing) {
    return (
      <span className={`font-display text-3xl leading-none tracking-tight text-ink ${className}`} aria-label="FOUR">
        FO<span className="text-red">U</span>R
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={imgRef} src={src} alt="FOUR" className={className} onError={() => setMissing(true)} />;
}
