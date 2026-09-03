/*
  Design-system entry for the FOUR storefront.

  apps/web has no component build of its own - it is a Next.js app - so this
  file is the entry the converter bundles. It re-exports only the presentation
  components that render standalone: no zustand store, no socket, no API, no
  browser geolocation. The rest of apps/web/src/components (Nav, CartDrawer,
  ChatDock, FourMap, TrackMap, CheckoutForm, the menu modals, and the home
  sections that read the store) is deliberately absent - each needs app
  infrastructure that has no meaning inside a design.

  Adding a component here is only half the job: pin its source path in
  .design-sync/config.json's componentSrcMap too, or discovery won't see it.
*/
export { BrandLogo } from "../../apps/web/src/components/BrandLogo";
export { SmartImage } from "../../apps/web/src/components/SmartImage";
export { RotatingSeal } from "../../apps/web/src/components/hero/RotatingSeal";
export { StickerTag } from "../../apps/web/src/components/ds/StickerTag";
export { SectionHeader, Hi } from "../../apps/web/src/components/ds/SectionHeader";
export { PillCta } from "../../apps/web/src/components/ds/PillCta";
export { PriceTag } from "../../apps/web/src/components/ds/PriceTag";
export { DoodleBackdrop } from "../../apps/web/src/components/ds/DoodleBackdrop";
export { PageTitleBand } from "../../apps/web/src/components/ds/PageTitleBand";
export { Ticker } from "../../apps/web/src/components/ds/Ticker";
export { Reveal } from "../../apps/web/src/components/ds/Reveal";
export { PhotoStrip } from "../../apps/web/src/components/hero/PhotoStrip";
export { LogoHero } from "../../apps/web/src/components/hero/LogoHero";
export { Marquee } from "../../apps/web/src/components/sections/Marquee";
export { CraftStory } from "../../apps/web/src/components/sections/CraftStory";
export { WorldFlavours } from "../../apps/web/src/components/sections/WorldFlavours";
export { DealsBand } from "../../apps/web/src/components/sections/DealsBand";
export { Footer } from "../../apps/web/src/components/sections/Footer";

/*
  Not a component - the preview-card wrapper wired as cfg.provider. It forces
  the reduced-motion branch so animated components settle deterministically in
  a card; see preview-root.tsx for why MotionConfig cannot do this. Excluded
  from the component list via componentSrcMap.
*/
export { PreviewRoot } from "./preview-root";
