import type { ReactNode } from "react";
import { DoodleBackdrop } from "./DoodleBackdrop";
import { SectionHeader } from "./SectionHeader";

/**
 * The red page-title band every inner page opens with: doodles, a centred
 * hero-size title (≤ 2 words in Title Case; CSS uppercases it) with two
 * stickers, and a lede. `titleAs="p"` when the page already renders its h1.
 */
export function PageTitleBand({
  title,
  highlight,
  tag,
  tag2,
  lede,
  titleAs = "h1",
  children,
}: {
  title: string;
  highlight?: string;
  tag?: string;
  tag2?: string;
  lede?: ReactNode;
  titleAs?: "h1" | "p";
  children?: ReactNode;
}) {
  return (
    <section className="f-titleband on-red">
      <DoodleBackdrop />
      <div className="wrap relative z-[1]">
        <SectionHeader as={titleAs} size="xl" align="center" title={title} highlight={highlight} tag={tag} tag2={tag2} lede={lede} />
        {children}
      </div>
    </section>
  );
}
