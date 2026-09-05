"use client";

/**
 * The v3 type hero: a solid red block with the proof row, the Anton headline
 * with one yellow highlight and two stickers, the lede and the pill CTAs,
 * then the four-photo strip hanging into the white section below (Dinevo's
 * overlapping media slot). Store-free on purpose - it is a design-sync
 * component and lib/store would pull socket.io into the design bundle - so
 * "Do you deliver to me?" clicks the nav's location pill by contract.
 */
import { BASE_DELIVERY_MINUTES, BRANCHES, FREE_DELIVERY_ABOVE, formatPKR } from "@four/shared";
import { useKitchenOpen } from "@/lib/useKitchenOpen";
import { CLOSES_LABEL, OPENS_LABEL } from "@/lib/hours";
import { Hi, SectionHeader } from "../ds/SectionHeader";
import { PillCta } from "../ds/PillCta";
import { MagneticCta } from "../ds/MagneticCta";
import { Rise } from "../ds/Rise";
import { LineRise } from "../ds/LineRise";
import { DoodleBackdrop } from "../ds/DoodleBackdrop";
import { PhotoStrip } from "./PhotoStrip";

const findMeDefault = () => document.querySelector<HTMLButtonElement>("header [data-open-location]")?.click();

export function LogoHero({ onFindMe = findMeDefault }: { onFindMe?: () => void }) {
  const open = useKitchenOpen();

  return (
    <>
      <section id="top" className="f-hero on-red">
        <DoodleBackdrop />
        <div className="wrap relative z-[1]">
          <Rise as="ul" role="list" delay={0.1} className="f-hero__proof">
            <li>{BRANCHES.length} kitchens · Lahore</li>
            <li>
              <span className={`f-dot f-dot--cream ${open ? "" : "f-dot--off"}`} aria-hidden>
                {open && <span className="f-dot__ping" />}
                <span className="f-dot__core" />
              </span>
              {open ? `Open now · till ${CLOSES_LABEL}` : `Opens ${OPENS_LABEL} · order ahead`}
            </li>
            <li>Free delivery over {formatPKR(FREE_DELIVERY_ABOVE)}</li>
          </Rise>

          {/* the visible title is decorative so a screen reader hears the full sentence once */}
          <h1 className="sr-only">
            FOUR — smash burgers, crown crust pizzas and loaded fries, made from scratch and delivered across Lahore in about{" "}
            {BASE_DELIVERY_MINUTES} minutes.
          </h1>
          {/* No fade and no mask on the headline: it is the likely LCP element,
              and Chrome counts neither an element at opacity 0 nor text
              translated out of a clip box as painted. The two lines rise at
              full opacity instead, staggered — louder than the single block
              fade it replaces, and it cannot cost an LCP timestamp. */}
          <div aria-hidden>
            <SectionHeader
              as="p"
              size="xl"
              align="center"
              className="f-hero__title"
              title={
                <LineRise
                  delay={0.15}
                  lines={[
                    "Smashed to order.",
                    <>
                      At your door in <Hi>{BASE_DELIVERY_MINUTES}</Hi> min.
                    </>,
                  ]}
                />
              }
              tag="110g patties"
              tag2="Crown crust"
            />
          </div>

          <Rise as="p" delay={0.4} className="f-hero__info">
            110g patties pressed to a lace-edged crisp. Crown crusts stuffed by hand every morning. Sauces from scratch, in three Lahore kitchens.
          </Rise>

          <Rise delay={0.5} className="f-hero__actions">
            <MagneticCta>
              <PillCta href="/menu">Order now</PillCta>
            </MagneticCta>
            <PillCta tone="on-red" arrow={false} onClick={onFindMe}>
              Do you deliver to me?
            </PillCta>
          </Rise>
        </div>
      </section>
      <PhotoStrip />
    </>
  );
}
