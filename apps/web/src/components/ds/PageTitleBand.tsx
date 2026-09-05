import type { ReactNode } from "react";
import { DoodleBackdrop } from "./DoodleBackdrop";
import { SectionHeader } from "./SectionHeader";
import { WordRise } from "./WordRise";

/**
 * The page-title masthead every inner page opens with: doodles, a centred
 * hero-size title (≤ 2 words in Title Case; CSS uppercases it) with two
 * stickers, and a lede. `titleAs="p"` when the page already renders its h1.
 *
 * White by default. This one line used to hardcode `on-red`, which is why every
 * inner page opened with a full-bleed red slab and spent one of its three
 * burgundy moments before saying anything. A hero-size Anton title in burgundy
 * on white is 12.15:1 and reads as an editorial masthead rather than a banner;
 * `ground` buys a coloured one back for a page whose ration allows it.
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
  ground = "white",
  children,
}: {
  title: string;
  highlight?: string;
  tag?: string;
  tag2?: string;
  lede?: ReactNode;
  titleAs?: "h1" | "p";
  animate?: boolean;
  /** The masthead ground. Only spend "burgundy" where the page's ration allows. */
  ground?: "white" | "cream" | "burgundy";
  children?: ReactNode;
}) {
  return (
    <section className={`f-titleband${ground === "burgundy" ? " on-red" : ground === "cream" ? " on-cream" : ""}`}>
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
