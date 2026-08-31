import { RotatingSeal, SmartImage } from "@four/ui";

/** On the beige ground at the size the storefront pins it to the hero shot. */
export const Default = () => (
  <div className="flex items-center justify-center bg-beige p-10">
    <RotatingSeal className="w-40" />
  </div>
);

/** Sizes: the curved text stops being legible much below w-24. */
export const Sizes = () => (
  <div className="flex flex-wrap items-center justify-center gap-8 bg-beige p-10">
    <RotatingSeal className="w-24" />
    <RotatingSeal className="w-32" />
    <RotatingSeal className="w-40" />
  </div>
);

/** Its intended use - overlapping a photo corner, which is why it has no ground of its own. */
export const OverPhoto = () => (
  <div className="bg-beige p-10">
    <div className="relative mx-auto w-full max-w-sm">
      <SmartImage
        src="/gallery/gallery-3.jpg"
        alt="A FOUR smash burger, fresh off the pass"
        fallbackLabel="F"
        className="aspect-square w-full rounded-card object-cover"
      />
      <RotatingSeal className="absolute -bottom-6 -right-6 w-28" />
    </div>
  </div>
);
