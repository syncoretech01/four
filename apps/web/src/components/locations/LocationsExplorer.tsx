"use client";

/**
 * The branch finder: three branch cards synced with a sticky MapLibre map
 * (card click flies the map; marker click selects the card), plus the full
 * delivery-coverage chip cloud. "Order from here" opens the location picker
 * scoped to that branch's areas - routing stays area-driven underneath
 * (branchForArea), so the scoped picker can never mis-route an order.
 */
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { BRAND, BRANCHES, HOURS_LABEL, LAHORE_AREAS, deliveryEtaLabel } from "@four/shared";
import { useKitchenOpen } from "@/lib/useKitchenOpen";
import { LocationModal } from "../LocationModal";

const LocationsMap = dynamic(() => import("./LocationsMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-beige" aria-hidden />,
});

export function LocationsExplorer() {
  const kitchenOpen = useKitchenOpen();
  const [selectedId, setSelectedId] = useState(BRANCHES[0].id);
  const [flyRequest, setFlyRequest] = useState<{ id: string; n: number } | null>(null);
  const [expandedAreas, setExpandedAreas] = useState<string | null>(null);
  const [picker, setPicker] = useState<{ areaIds?: string[]; initialAreaId?: string; intro?: string } | null>(null);

  const areaById = useMemo(() => new Map(LAHORE_AREAS.map((a) => [a.id, a])), []);

  const select = (id: string, fly = true) => {
    setSelectedId(id);
    if (fly) setFlyRequest((cur) => ({ id, n: (cur?.n ?? 0) + 1 }));
  };

  return (
    <>
      <div className="wrap grid gap-10 pb-16 lg:grid-cols-[minmax(24rem,2fr)_3fr]">
        {/* ── Branch cards ── */}
        <div className="grid content-start gap-6">
          {BRANCHES.map((b, i) => {
            const expanded = expandedAreas === b.id;
            const areas = b.areaIds.map((id) => areaById.get(id)).filter(Boolean);
            const shown = expanded ? areas : areas.slice(0, 5);
            const selected = selectedId === b.id;
            return (
              <article
                key={b.id}
                onClick={() => select(b.id)}
                className={`f-card f-card--pad cursor-pointer ${selected ? "is-selected" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="f-tag f-tag--muted">0{i + 1}</span>
                    <h2 className="f-heading f-heading--sm mt-3">{b.name}</h2>
                    <p className="mt-1 text-sm text-ink-600">{b.address}</p>
                  </div>
                </div>

                <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-ink-900">
                  <span className={`f-dot ${kitchenOpen ? "" : "f-dot--off"}`} aria-hidden>
                    {kitchenOpen && <span className="f-dot__ping" />}
                    <span className="f-dot__core" />
                  </span>
                  {kitchenOpen ? "Open now" : "Opens 1:00 pm"}
                  <span className="font-medium text-ink-600">· {HOURS_LABEL.replace("Open daily ", "")}</span>
                </p>

                <div className="mt-4">
                  <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-ink-600">Delivers to</span>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {shown.map(
                      (a) =>
                        a && (
                          <button
                            key={a.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPicker({ initialAreaId: a.id });
                            }}
                            className="f-chip f-chip--sm px-2.5 py-1 text-xs"
                            title={`Delivery in about ${deliveryEtaLabel(a.distanceKm)}`}
                          >
                            {a.name}
                          </button>
                        ),
                    )}
                    {areas.length > 5 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedAreas(expanded ? null : b.id);
                        }}
                        className="f-chip f-chip--sm f-chip--soft px-2.5 py-1 text-xs"
                      >
                        {expanded ? "Show fewer" : `+${areas.length - 5} more`}
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPicker({
                        areaIds: b.areaIds,
                        intro: `${b.shortName} delivers to these areas - pick yours and order.`,
                      });
                    }}
                    className="f-btn f-btn--primary f-btn--sm"
                  >
                    Order from here
                  </button>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="f-btn f-btn--secondary f-btn--sm"
                  >
                    Directions
                  </a>
                  <a
                    href={BRAND.phoneHref}
                    onClick={(e) => e.stopPropagation()}
                    className="f-btn f-btn--quiet f-btn--sm"
                  >
                    {BRAND.phone}
                  </a>
                </div>
              </article>
            );
          })}
        </div>

        {/* ── Sticky map ── */}
        <div className="lg:sticky lg:top-[calc(var(--nav-h-scrolled)+1.5rem)] lg:self-start">
          <div className="aspect-[4/5] overflow-hidden rounded-card border border-rule sm:aspect-[16/10] lg:aspect-auto lg:h-[34rem]">
            <LocationsMap flyRequest={flyRequest} onSelect={(id) => select(id, false)} />
          </div>
          <p className="mt-2 text-xs text-ink-600">
            Tap a pin to highlight its branch. Orders route automatically to the kitchen covering your area.
          </p>
        </div>
      </div>

      {/* ── Coverage chip cloud ── */}
      <section className="bg-[var(--bg-page-alt)]">
        <div className="wrap band">
          <p className="f-eyebrow">Delivery coverage</p>
          <h2 className="f-heading f-heading--lg">Is your block covered?</h2>
          <p className="f-lede">
            {LAHORE_AREAS.length} areas across Lahore. Tap yours to see the delivery time and start an order.
          </p>
          <div className="mt-8 grid gap-8">
            {BRANCHES.map((b) => (
              <div key={b.id}>
                <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-ink-600">
                  From {b.shortName}
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {b.areaIds.map((id) => {
                    const a = areaById.get(id);
                    return (
                      a && (
                        <button key={id} onClick={() => setPicker({ initialAreaId: id })} className="f-chip f-chip--sm">
                          {a.name}
                          <span className="text-xs font-semibold text-ink-600">
                            · {deliveryEtaLabel(a.distanceKm)}
                          </span>
                        </button>
                      )
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setPicker({})} className="f-btn f-btn--primary f-btn--lg mt-10">
            Check your block
          </button>
        </div>
      </section>

      <LocationModal
        open={picker !== null}
        onClose={() => setPicker(null)}
        areaIds={picker?.areaIds}
        initialAreaId={picker?.initialAreaId}
        intro={picker?.intro}
      />
    </>
  );
}
