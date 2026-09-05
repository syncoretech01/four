import { SmartImage } from "../SmartImage";
import { Rise } from "../ds/Rise";

export interface StripPhoto {
  /** File stem under /public/hero: strip-<name>.jpg and strip-<name>@640.jpg */
  name: string;
  alt: string;
}

/**
 * "One shoot, two backdrops": the four product pillars from the brand shoot,
 * cropped 4:5 and ordered dark / yellow / dark / yellow so the two red FOUR
 * props sit in the middle tiles. Recipe in public/hero/README.md.
 */
export const STRIP: StripPhoto[] = [
  { name: "smash", alt: "A FOUR smash burger — melted cheese and flamin' hot crumbs over a lace-edged patty — on a wooden board" },
  { name: "fries", alt: "Loaded fries in a red FOUR tray: crinkle fries under smashed beef, sauces and shredded lettuce" },
  { name: "crown", alt: "A crown crust pizza with stuffed crown points and a ranch spiral, on a wooden board over a FOUR box" },
  { name: "shake", alt: "A FOUR shake in a branded cup with a red straw" },
];

/**
 * The media block that hangs from the red hero into the white section below
 * (Dinevo's overlapping video slot, done with stills). The negative margin
 * lives on the `.wrap`; each tile is rounded on its own so no seam crosses the
 * red/white edge. 2x2 below 768px so all four pillars stay above the fold.
 *
 * The first two tiles are `priority` (eager, fetchpriority=high) and are the
 * likely LCP element, so they rise without fading: Chrome does not count an
 * element at opacity 0 as an LCP candidate, and fading them threw away the
 * head start their preload buys.
 */
export function PhotoStrip({ photos = STRIP }: { photos?: StripPhoto[] }) {
  return (
    <div className="f-hero-media">
      <div className="wrap f-hero-media__inner">
        <div className="f-strip">
          {photos.map((p, i) => (
            <Rise key={p.name} delay={i * 0.08} fade={i >= 2}>
              <SmartImage
                src={`/hero/strip-${p.name}.jpg`}
                srcSet={`/hero/strip-${p.name}.jpg 1040w, /hero/strip-${p.name}@640.jpg 640w`}
                sizes="(min-width: 768px) 25vw, 50vw"
                width={1040}
                height={1300}
                alt={p.alt}
                priority={i < 2}
                className="h-full w-full"
              />
            </Rise>
          ))}
        </div>
      </div>
    </div>
  );
}
