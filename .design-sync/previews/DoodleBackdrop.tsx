import { DoodleBackdrop } from "@four/ui";

/**
 * The faint line-art backdrop masks /doodles/sheet.png, a storefront-owned
 * asset that does not resolve inside a design - so this card shows a solid
 * red block, which is exactly how the app degrades without the sheet.
 */
export const OnRed = () => (
  <div className="on-red relative isolate h-64 rounded-[20px]">
    <DoodleBackdrop />
    <p className="relative z-[1] p-8 font-display text-3xl uppercase">Doodles behind this</p>
  </div>
);
