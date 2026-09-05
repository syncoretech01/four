import type { ReactNode } from "react";
import { DoodleBackdrop } from "./DoodleBackdrop";
import { SectionHeader } from "./SectionHeader";
import { WordRise } from "./WordRise";

/**
 * The red page-title band every inner page opens with: doodles, a centred
 * hero-size title (≤ 2 words in Title Case; CSS uppercases it) with two
 * stickers, and a lede. `titleAs="p"` when the page already renders its h1.
 *
 * The title arrives word by word in `mount` mode — a CSS animation at first
 * paint that moves transform only. This band is the top of the page and so
 * usually the LCP element; a fade would start it at opacity 0 and disqualify it
 * as an LCP candidate. `animate={false}` opts out.
 */
export function PageTitleBand({
  title,
  highlight,
  tag,
  tag2,
  lede,
  titleAs = "h1",
  animate = true,
  children,
}: {
  title: string;
  highlight?: string;
  tag?: string;
  tag2?: string;
  lede?: ReactNode;
  titleAs?: "h1" | "p";
  animate?: boolean;
  children?: ReactNode;
}) {
  return (
    <section className="f-titleband on-red">
      <DoodleBackdrop />
      <div className="wrap relative z-[1]">
        <SectionHeader
          as={titleAs}
          size="xl"
          align="center"
          title={animate ? <WordRise text={title} highlight={highlight} mode="mount" stagger={0.06} /> : title}
          highlight={animate ? undefined : highlight}
          tag={tag}
          tag2={tag2}
          lede={lede}
        />
        {children}
      </div>
    </section>
  );
}
