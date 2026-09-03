import { StickerTag } from "@four/ui";

/** The four tones. Pink is always decorative (aria-hidden); tilts are for headings. */
export const Tones = () => (
  <div className="flex flex-wrap items-center gap-4 bg-white p-8">
    <StickerTag>Best seller</StickerTag>
    <StickerTag tone="pink">Order now</StickerTag>
    <StickerTag tone="red">Spicy</StickerTag>
    <StickerTag tone="white">New</StickerTag>
    <StickerTag round>Round</StickerTag>
  </div>
);

/** Tilted, the way a heading wears them. */
export const Tilted = () => (
  <div className="flex items-center gap-10 bg-white p-10">
    <StickerTag tilt="left">The menu</StickerTag>
    <StickerTag tone="pink" tilt="right">
      11 categories
    </StickerTag>
  </div>
);

/** On red the yellow sticker carries; on yellow it turns white by the DS guard. */
export const OnGrounds = () => (
  <div className="grid grid-cols-2">
    <div className="on-red p-8">
      <StickerTag>Free delivery</StickerTag>
    </div>
    <div className="on-yellow p-8">
      <StickerTag>Free delivery</StickerTag>
    </div>
  </div>
);
