"use client";

/**
 * The /locations map: numbered branch pins over the FOUR basemap. Only ever
 * imported through next/dynamic (ssr: false) - this module statically pulls
 * maplibre, which has no business in the server bundle.
 */
import { useEffect, useRef } from "react";
import { BRANCHES, LAHORE_CENTER } from "@four/shared";
import { FourMap, maplibregl, type MLMap } from "../map/FourMap";

function numberPin(n: number): HTMLElement {
  const div = document.createElement("div");
  div.innerHTML = `<div style="width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#9d1d20;border:3px solid #f6efe1;box-shadow:0 4px 10px rgba(38,32,26,.35);display:flex;align-items:center;justify-content:center;cursor:pointer">
    <span style="transform:rotate(45deg);color:#f6efe1;font-weight:800;font-family:sans-serif;font-size:13px">${n}</span>
  </div>`;
  return div.firstElementChild as HTMLElement;
}

export default function LocationsMap({
  flyRequest,
  onSelect,
}: {
  /** Bump `n` to fly to branch `id` - a plain id prop couldn't re-fly the same branch twice. */
  flyRequest: { id: string; n: number } | null;
  onSelect: (branchId: string) => void;
}) {
  const mapRef = useRef<MLMap | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!flyRequest) return;
    const b = BRANCHES.find((x) => x.id === flyRequest.id);
    if (b) mapRef.current?.flyTo({ center: [b.lng, b.lat], zoom: 12.5 });
  }, [flyRequest]);

  const onMap = (map: MLMap) => {
    mapRef.current = map;
    const bounds = new maplibregl.LngLatBounds();
    BRANCHES.forEach((b, i) => {
      const pin = numberPin(i + 1);
      pin.addEventListener("click", () => onSelectRef.current(b.id));
      new maplibregl.Marker({ element: pin, anchor: "bottom" }).setLngLat([b.lng, b.lat]).addTo(map);
      bounds.extend([b.lng, b.lat]);
    });
    map.fitBounds(bounds, { padding: 80, duration: 0 });
    return () => {
      mapRef.current = null;
    };
  };

  return <FourMap center={[LAHORE_CENTER.lng, LAHORE_CENTER.lat]} zoom={10.8} onMap={onMap} className="h-full w-full" />;
}
