"use client";

/**
 * Live delivery map for the tracking page: destination pin (customer),
 * branch pin (kitchen), and the rider's dot moving in real time from
 * rider:position socket events. Fits bounds around the actors.
 */
import { useEffect, useRef } from "react";
import { BRANCHES } from "@four/shared";
import { getSocket } from "@/lib/socket";
import { FourMap, maplibregl, type MLMap } from "./FourMap";

function el(html: string): HTMLElement {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.firstElementChild as HTMLElement;
}

const destPin = () =>
  el(`<div style="width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#9d1d20;border:3px solid #f6efe1;box-shadow:0 4px 10px rgba(38,32,26,.35);display:flex;align-items:center;justify-content:center">
    <span style="transform:rotate(45deg);color:#f6efe1;font-weight:800;font-family:sans-serif;font-size:13px">4</span>
  </div>`);

const branchPin = () =>
  el(`<div style="width:26px;height:26px;border-radius:8px;background:#26201a;border:2px solid #f6efe1;box-shadow:0 3px 8px rgba(38,32,26,.3);display:flex;align-items:center;justify-content:center;color:#f6efe1;font-size:12px">🍔</div>`);

const riderDot = () =>
  el(`<div style="position:relative;width:22px;height:22px">
    <span style="position:absolute;inset:-8px;border-radius:50%;background:rgba(157,29,32,.25);animation:fourping 1.6s ease-out infinite"></span>
    <span style="position:absolute;inset:0;border-radius:50%;background:#9d1d20;border:3px solid #f6efe1;box-shadow:0 3px 8px rgba(38,32,26,.4)"></span>
    <style>@keyframes fourping{0%{transform:scale(.6);opacity:.8}100%{transform:scale(1.6);opacity:0}}</style>
  </div>`);

export function TrackMap({
  orderNumber,
  branchId,
  dest,
}: {
  orderNumber: string;
  branchId?: string;
  dest: { lat: number; lng: number };
}) {
  const riderMarkerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    return () => {
      riderMarkerRef.current = null;
    };
  }, []);

  const branch = BRANCHES.find((b) => b.id === branchId);

  const onMap = (map: MLMap) => {
    new maplibregl.Marker({ element: destPin(), anchor: "bottom" }).setLngLat([dest.lng, dest.lat]).addTo(map);
    const bounds = new maplibregl.LngLatBounds([dest.lng, dest.lat], [dest.lng, dest.lat]);
    if (branch) {
      new maplibregl.Marker({ element: branchPin() }).setLngLat([branch.lng, branch.lat]).addTo(map);
      bounds.extend([branch.lng, branch.lat]);
    }
    map.fitBounds(bounds, { padding: 70, maxZoom: 14, duration: 0 });

    const socket = getSocket();
    const onRider = (p: { orderNumbers: string[]; lat: number; lng: number }) => {
      if (!p.orderNumbers.includes(orderNumber)) return;
      if (!riderMarkerRef.current) {
        riderMarkerRef.current = new maplibregl.Marker({ element: riderDot() }).setLngLat([p.lng, p.lat]).addTo(map);
        bounds.extend([p.lng, p.lat]);
        map.fitBounds(bounds, { padding: 70, maxZoom: 14 });
      } else {
        riderMarkerRef.current.setLngLat([p.lng, p.lat]);
      }
    };
    socket.on("rider:position", onRider);
    return () => {
      socket.off("rider:position", onRider);
    };
  };

  return (
    <FourMap
      center={[dest.lng, dest.lat]}
      zoom={12.5}
      onMap={onMap}
      className="relative h-72 w-full overflow-hidden rounded-card sm:h-80"
    />
  );
}
