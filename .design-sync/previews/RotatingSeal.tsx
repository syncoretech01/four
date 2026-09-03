import { RotatingSeal, SmartImage } from "@four/ui";

/** The beige disc with the red hand - the lockup the storefront pins to the craft-story card. */
export const Default = () => (
  <div className="flex items-center justify-center bg-white p-10">
    <RotatingSeal className="w-40" />
  </div>
);

/** Sizes: the curved text stops being legible much below w-24. */
export const Sizes = () => (
  <div className="flex flex-wrap items-center justify-center gap-8 bg-white p-10">
    <RotatingSeal className="w-24" />
    <RotatingSeal className="w-32" />
    <RotatingSeal className="w-40" />
  </div>
);

/** The red disc variant - white ring text and hand - for beige or white grounds. */
export const OnRed = () => (
  <div className="flex items-center justify-center bg-beige p-10">
    <RotatingSeal className="w-40" tone="red" />
  </div>
);

/** Its intended use - straddling a photo's bottom edge inside a red card. */
export const OverPhoto = () => (
  <div className="bg-white p-10">
    <div className="on-red relative mx-auto w-full max-w-sm overflow-hidden rounded-[20px] pb-24">
      <SmartImage src="/home/craft-crown.jpg" alt="A hand-stuffed crown crust pizza" fallbackLabel="U" className="aspect-[4/3] w-full object-cover" />
      <RotatingSeal className="absolute bottom-4 left-1/2 w-28 -translate-x-1/2" />
    </div>
  </div>
);
