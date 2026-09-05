/**
 * Faint line-art backdrop (the brand's own highlight drawings, keyed to a mask
 * by scripts/doodle-sheet.mjs).
 *
 * It takes no tone. The colour and opacity come from the ground context via
 * `--doodle` / `--doodle-opacity`, so a bare `<DoodleBackdrop />` is correct on
 * every ground automatically. It used to default to white-at-10%, which was
 * right only while every host section was red — ten of the fourteen call sites
 * omitted the prop, and all ten would have rendered an invisible white wash the
 * moment their section became white.
 *
 * The host section needs `relative isolate` and its content `relative z-[1]`.
 */
export function DoodleBackdrop({ edges = false, className = "" }: { edges?: boolean; className?: string }) {
  return <div aria-hidden className={["f-doodle", edges && "f-doodle--edges", className].filter(Boolean).join(" ")} />;
}
