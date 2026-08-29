"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Image slot that degrades gracefully while the real photography from the
 * brand kit is being dropped into /public/menu. When the file exists it
 * renders it; otherwise it renders a branded tile so the layout never
 * shows a broken image. The mount-time naturalWidth check catches loads
 * that failed before hydration, where onError never reaches React.
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
        className={`flex items-center justify-center bg-[radial-gradient(circle_at_35%_30%,#efe1cb,#e5d8c3)] ${className}`}
        role="img"
        aria-label={alt}
      >
        <span className="font-display text-5xl text-red/15 select-none">{(fallbackLabel ?? alt).slice(0, 1).toUpperCase()}</span>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={imgRef} src={src} alt={alt} className={className} loading="lazy" onError={() => setMissing(true)} />;
}
