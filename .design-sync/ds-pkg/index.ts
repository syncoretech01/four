/*
  Design-system entry for the FOUR storefront.

  apps/web has no component build of its own - it is a Next.js app - so this
  file is the entry the converter bundles. It re-exports only the presentation
  components that render standalone: no zustand store, no socket, no API, no
  browser geolocation. The rest of apps/web/src/components (Nav, CartDrawer,
  ChatDock, FourMap, TrackMap, CheckoutForm, and the menu modals) is deliberately
  absent - each needs app infrastructure that has no meaning inside a design.

  Adding a component here is only half the job: pin its source path in
  .design-sync/config.json's componentSrcMap too, or discovery won't see it.
*/
export { BrandLogo } from "../../apps/web/src/components/BrandLogo";
export { SmartImage } from "../../apps/web/src/components/SmartImage";
export { LogoHero } from "../../apps/web/src/components/hero/LogoHero";
export { Marquee } from "../../apps/web/src/components/sections/Marquee";
export { CraftStory } from "../../apps/web/src/components/sections/CraftStory";
export { WorldFlavours } from "../../apps/web/src/components/sections/WorldFlavours";
export { Footer } from "../../apps/web/src/components/sections/Footer";
export { DealsBand } from "../../apps/web/src/components/sections/DealsBand";
export { RotatingSeal } from "../../apps/web/src/components/hero/RotatingSeal";

/*
  Not a component - the preview-card wrapper wired as cfg.provider. It forces
  the reduced-motion branch so animated components settle deterministically in
  a card; see preview-root.tsx for why MotionConfig cannot do this. Excluded
  from the component list via componentSrcMap.
*/
export { PreviewRoot } from "./preview-root";
