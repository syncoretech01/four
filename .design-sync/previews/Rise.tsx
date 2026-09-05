import { Rise } from "@four/ui";

/** Above-the-fold entrance; settled in a card because the provider forces reduced motion. */
export const Default = () => (
  <div className="bg-white p-8">
    <Rise>
      <div className="rounded-[20px] bg-cream p-8 font-display text-2xl uppercase text-red">Risen content</div>
    </Rise>
  </div>
);

/** Transform-only variant for anything that could be the LCP element. */
export const NoFade = () => (
  <div className="bg-white p-8">
    <Rise fade={false}>
      <div className="rounded-[20px] bg-cream p-8 font-display text-2xl uppercase text-red">LCP-safe</div>
    </Rise>
  </div>
);
