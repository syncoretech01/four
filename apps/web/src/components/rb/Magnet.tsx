"use client";

/**
 * Vendored from react-bits (MIT + Commons Clause),
 * src/ts-tailwind/Animations/Magnet/Magnet.tsx, fetched 2026-09-04.
 *
 * Adapted: "use client"; named export; the mousemove listener is registered
 * passive and only while enabled, so a disabled instance costs nothing; and no
 * transform or `will-change` is emitted at rest, so the SSR HTML stays free of
 * both (upstream always writes `translate3d(0,0,0)`, which pins a compositor
 * layer for every CTA on the page and trips the SSR visibility check).
 * Upstream prop defaults are untouched. Brand gating (coarse pointer, reduced
 * motion) lives in ds/MagneticCta — this file stays a faithful copy.
 */

import React, { useState, useEffect, useRef, type ReactNode, type HTMLAttributes } from "react";

interface MagnetProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: number;
  disabled?: boolean;
  magnetStrength?: number;
  activeTransition?: string;
  inactiveTransition?: string;
  wrapperClassName?: string;
  innerClassName?: string;
}

export function Magnet({
  children,
  padding = 100,
  disabled = false,
  magnetStrength = 2,
  activeTransition = "transform 0.3s ease-out",
  inactiveTransition = "transform 0.5s ease-in-out",
  wrapperClassName = "",
  innerClassName = "",
  ...props
}: MagnetProps) {
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const magnetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) {
      setPosition({ x: 0, y: 0 });
      setIsActive(false);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!magnetRef.current) return;
      const { left, top, width, height } = magnetRef.current.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      const distX = Math.abs(centerX - e.clientX);
      const distY = Math.abs(centerY - e.clientY);

      if (distX < width / 2 + padding && distY < height / 2 + padding) {
        setIsActive(true);
        setPosition({ x: (e.clientX - centerX) / magnetStrength, y: (e.clientY - centerY) / magnetStrength });
      } else {
        setIsActive(false);
        setPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [padding, disabled, magnetStrength]);

  return (
    <div ref={magnetRef} className={wrapperClassName} style={{ position: "relative", display: "inline-block" }} {...props}>
      <div
        className={innerClassName}
        style={{
          // Omitted entirely at rest, so the server HTML carries no transform
          // and no compositor layer for a control nobody is pointing at.
          ...(position.x || position.y ? { transform: `translate3d(${position.x}px, ${position.y}px, 0)` } : null),
          transition: isActive ? activeTransition : inactiveTransition,
          willChange: isActive ? "transform" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
