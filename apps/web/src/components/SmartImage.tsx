"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Image slot that degrades to a branded tile when a mapped photo is
 * missing, so the layout never shows a broken image. The mount-time
 * naturalWidth check catches loads that failed before hydration.
 */
export function SmartImage({
  src,
  alt,
  className = "",
  fallbackLabel,
}: {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}) {
  const [missing, setMissing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setMissing(true);
  }, []);

  if (missing) {
    return (
      <div
        className={`flex items-center justify-center bg-[radial-gradient(circle_at_35%_30%,var(--red-tint),var(--paper-300))] ${className}`}
        role="img"
        aria-label={alt}
      >
        <span className="font-display text-5xl font-bold uppercase text-red/20 select-none">
          {(fallbackLabel ?? alt).slice(0, 1).toUpperCase()}
        </span>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={imgRef} src={src} alt={alt} className={className} loading="lazy" onError={() => setMissing(true)} />;
}
