"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Image slot that degrades to a branded beige tile when a mapped photo is
 * missing, so the layout never shows a broken image. The mount-time
 * naturalWidth check catches loads that failed before hydration. `priority`
 * marks above-the-fold art (eager + high fetch priority); everything else
 * lazy-loads.
 */
export function SmartImage({
  src,
  alt,
  className = "",
  fallbackLabel,
  srcSet,
  sizes,
  width,
  height,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
  srcSet?: string;
  sizes?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}) {
  const [missing, setMissing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setMissing(true);
  }, []);

  if (missing) {
    const decorative = alt === "";
    return (
      <div
        className={`flex items-center justify-center bg-beige ${className}`}
        role={decorative ? undefined : "img"}
        aria-label={decorative ? undefined : alt}
        aria-hidden={decorative || undefined}
      >
        <span className="select-none font-display text-5xl uppercase text-red/20">{(fallbackLabel ?? alt).slice(0, 1).toUpperCase()}</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      width={width}
      height={height}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      onError={() => setMissing(true)}
    />
  );
}
