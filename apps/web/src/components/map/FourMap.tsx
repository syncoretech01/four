"use client";

/**
 * FOUR-branded basemap over OpenFreeMap vector tiles (keyless, free for
 * production). Beige land, red-accented labels; raw MapLibre lifecycle,
 * only ever imported through next/dynamic (ssr: false).
 */
import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import { Map as MLMap, type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

function fourStyle(): StyleSpecification {
  const c = {
    bg: "#e9dcc5",
    landuse: "#e2d3b8",
    green: "#d5d0ae",
    water: "#bcd0c4",
    building: "rgba(38,32,26,.06)",
    roadCasing: "rgba(255,253,247,.9)",
    roadMinor: "rgba(38,32,26,.12)",
    roadMajor: "rgba(38,32,26,.22)",
    roadHighway: "rgba(38,32,26,.34)",
    label: "#5f574b",
    labelHalo: "#f6efe1",
    place: "#26201a",
    placeMajor: "#9d1d20",
  };
  return {
    version: 8,
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    sources: { omt: { type: "vector", url: "https://tiles.openfreemap.org/planet" } },
    layers: [
      { id: "bg", type: "background", paint: { "background-color": c.bg } },
      { id: "landuse", type: "fill", source: "omt", "source-layer": "landuse", paint: { "fill-color": c.landuse } },
      { id: "park", type: "fill", source: "omt", "source-layer": "park", paint: { "fill-color": c.green } },
      { id: "water", type: "fill", source: "omt", "source-layer": "water", paint: { "fill-color": c.water } },
      { id: "building", type: "fill", source: "omt", "source-layer": "building", minzoom: 13, paint: { "fill-color": c.building } },
      {
        id: "road-casing",
        type: "line",
        source: "omt",
        "source-layer": "transportation",
        paint: { "line-color": c.roadCasing, "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1.5, 16, 7] },
      },
      {
        id: "road-minor",
        type: "line",
        source: "omt",
        "source-layer": "transportation",
        filter: ["all", ["!in", "class", "motorway", "trunk", "primary", "secondary"]],
        paint: { "line-color": c.roadMinor, "line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.5, 16, 3] },
      },
      {
        id: "road-major",
        type: "line",
        source: "omt",
        "source-layer": "transportation",
        filter: ["in", "class", "primary", "secondary", "tertiary"],
        paint: { "line-color": c.roadMajor, "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1, 16, 5] },
      },
      {
        id: "road-highway",
        type: "line",
        source: "omt",
        "source-layer": "transportation",
        filter: ["in", "class", "motorway", "trunk"],
        paint: { "line-color": c.roadHighway, "line-width": ["interpolate", ["linear"], ["zoom"], 8, 1.5, 16, 6] },
      },
      {
        id: "road-label",
        type: "symbol",
        source: "omt",
        "source-layer": "transportation_name",
        minzoom: 13,
        layout: { "symbol-placement": "line", "text-field": ["get", "name"], "text-font": ["Noto Sans Regular"], "text-size": 11 },
        paint: { "text-color": c.label, "text-halo-color": c.labelHalo, "text-halo-width": 1.2 },
      },
      {
        id: "place-label",
        type: "symbol",
        source: "omt",
        "source-layer": "place",
        filter: ["in", "class", "suburb", "neighbourhood", "quarter"],
        layout: { "text-field": ["get", "name"], "text-font": ["Noto Sans Regular"], "text-size": 12 },
        paint: { "text-color": c.place, "text-halo-color": c.labelHalo, "text-halo-width": 1.4 },
      },
      {
        id: "city-label",
        type: "symbol",
        source: "omt",
        "source-layer": "place",
        filter: ["in", "class", "city", "town"],
        layout: { "text-field": ["get", "name"], "text-font": ["Noto Sans Bold"], "text-size": 14 },
        paint: { "text-color": c.placeMajor, "text-halo-color": c.labelHalo, "text-halo-width": 1.4 },
      },
    ],
  };
}

export function FourMap({
  center,
  zoom = 12.5,
  onMap,
  className = "",
}: {
  center: [number, number];
  zoom?: number;
  onMap?: (map: MLMap) => void | (() => void);
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const onMapRef = useRef(onMap);
  onMapRef.current = onMap;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: fourStyle(),
      center,
      zoom,
      attributionControl: { compact: true },
      cooperativeGestures: true,
    });
    mapRef.current = map;
    let cleanup: void | (() => void);
    map.on("load", () => {
      cleanup = onMapRef.current?.(map);
    });
    return () => {
      cleanup?.();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className={className} style={{ background: "#e9dcc5" }} />;
}

export { maplibregl };
export type { MLMap };
