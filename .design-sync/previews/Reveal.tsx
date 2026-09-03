import { Reveal } from "@four/ui";

/** Scroll-in wrapper; settled in a card because the provider forces reduced motion. */
export const Default = () => (
  <div className="bg-white p-8">
    <Reveal>
      <div className="rounded-[20px] bg-cream p-8 font-display text-2xl uppercase text-red">Revealed content</div>
    </Reveal>
  </div>
);
