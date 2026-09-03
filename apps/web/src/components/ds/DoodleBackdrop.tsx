/**
 * Faint line-art backdrop (the brand's own highlight drawings, keyed to a mask
 * by scripts/doodle-sheet.mjs). White at 10% on red grounds, red at 8% on cream.
 * The host section needs `relative isolate` and its content `relative z-[1]`.
 */
export function DoodleBackdrop({ tone = "white", edges = false, className = "" }: { tone?: "white" | "red"; edges?: boolean; className?: string }) {
  return <div aria-hidden className={["f-doodle", tone === "red" && "f-doodle--red", edges && "f-doodle--edges", className].filter(Boolean).join(" ")} />;
}
