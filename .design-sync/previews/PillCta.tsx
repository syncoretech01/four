import { PillCta } from "@four/ui";

/** The storefront CTA: yellow pill plus a separate arrow circle, one focusable element. */
export const Tones = () => (
  <div className="flex flex-wrap items-center gap-5 bg-white p-8">
    <PillCta href="#">Order now</PillCta>
    <PillCta href="#" tone="red">
      Place order
    </PillCta>
    <PillCta href="#" tone="outline">
      All deals
    </PillCta>
    <PillCta href="#" tone="card" arrow={false}>
      Build this meal
    </PillCta>
  </div>
);

/** Sizes keep the arrow circle equal to the pill height. */
export const Sizes = () => (
  <div className="flex flex-wrap items-center gap-5 bg-white p-8">
    <PillCta href="#" size="sm">
      Small
    </PillCta>
    <PillCta href="#" size="md">
      Medium
    </PillCta>
    <PillCta href="#" size="lg">
      Large
    </PillCta>
  </div>
);

/** On red: the yellow pill and the outlined on-red secondary. */
export const OnRed = () => (
  <div className="on-red flex flex-wrap items-center gap-5 p-8">
    <PillCta href="#">Order now</PillCta>
    <PillCta href="#" tone="on-red" arrow={false}>
      Do you deliver to me?
    </PillCta>
  </div>
);
