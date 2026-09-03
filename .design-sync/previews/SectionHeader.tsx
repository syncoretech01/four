import { SectionHeader } from "@four/ui";

/** Left-aligned section header: one highlighted word, two stickers, a lede. */
export const Default = () => (
  <div className="bg-white p-10">
    <SectionHeader
      title="What are you craving?"
      highlight="craving"
      tag="The menu"
      tag2="11 categories"
      lede="Every burger on the board carries the city that inspired it. All of them are cooked here."
    />
  </div>
);

/** Centred on red: the heading turns white and the highlight yellow through the ground context. */
export const OnRed = () => (
  <div className="on-red p-10">
    <SectionHeader align="center" title="The hits Lahore keeps reordering" highlight="reordering" tag="Best sellers" tag2="Order now" />
  </div>
);

/** Hero size, as the page-title bands use it. */
export const Hero = () => (
  <div className="on-red p-10">
    <SectionHeader as="p" size="xl" align="center" title="The Menu" tag="Order online" tag2="Made fresh" />
  </div>
);
