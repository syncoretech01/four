/**
 * The /about page body - the food-craft story in six beats:
 * title band → the photo pair → the story header + real-number stats →
 * three staggered process beats → the kitchens (the page's one red band) →
 * house sauces (cream) → closing photo card.
 * Every claim comes from menu data; every photo goes through SmartImage.
 */
import Link from "next/link";
import { BASE_DELIVERY_MINUTES, BRANCHES, HOURS_LABEL, LAHORE_AREAS, MENU_ITEMS, formatPKR } from "@four/shared";
import { SmartImage } from "../SmartImage";
import { RotatingSeal } from "../hero/RotatingSeal";
import { PageTitleBand } from "../ds/PageTitleBand";
import { SectionHeader, Hi } from "../ds/SectionHeader";
import { PillCta } from "../ds/PillCta";
import { StatNumber } from "../ds/StatNumber";
import { FloatHeading } from "../ds/FloatHeading";
import { DoodleBackdrop } from "../ds/DoodleBackdrop";
import { Reveal } from "../ds/Reveal";

/** House sauces and where they live - names verbatim from menu descriptions. */
const SCRATCH: { sauce: string; itemId: string; itemName: string }[] = [
  { sauce: "FOUR Sauce", itemId: "classic-new-york", itemName: "Classic New York" },
  { sauce: "Bangkok Chilli Glaze", itemId: "bangkok-chipotle", itemName: "Bangkok Chipotle" },
  { sauce: "Truffle Mayo", itemId: "paris-truffle", itemName: "Paris Truffle" },
  { sauce: "Honey Mustard", itemId: "cairo-honey-mustard", itemName: "Cairo Honey Mustard" },
  { sauce: "House Ranch", itemId: "ranchstar", itemName: "Ranchstar" },
  { sauce: "Lotus Crumble", itemId: "lotus-shake", itemName: "Lotus Shake" },
];

/** Real numbers only: the patty weight is printed on the menu, the rest are shared constants. */
const STATS: { value: number; unit?: string; label: string }[] = [
  { value: 110, unit: "g", label: "per patty" },
  { value: BRANCHES.length, label: "Lahore kitchens" },
  { value: LAHORE_AREAS.length, label: "delivery areas" },
  { value: BASE_DELIVERY_MINUTES, unit: "min", label: "base delivery time" },
];

/** The three process beats, in the order the kitchen does them. */
const BEATS: { no: string; title: string; copy: string; src: string; alt: string; fallback: string }[] = [
  {
    no: "01",
    title: "The smash",
    copy: "The 110g ball hits a screaming-hot plate and gets pressed once, hard. More crust, more flavour, no grey middle.",
    src: "/menu-items/texas-flamin-hot.jpg",
    alt: "Texas Flamin Hot smash burger, crust up close",
    fallback: "F",
  },
  {
    no: "02",
    title: "The crowns",
    copy: "Hand-stretched dough. The crown is rolled, stuffed — cheese, malai boti, seekh kebab — and sealed every morning.",
    src: "/menu-items/malai-boti-crown-red.jpg",
    alt: "Malai boti crown crust pizza, the stuffed ring up close",
    fallback: "U",
  },
  {
    no: "03",
    title: "The sauces",
    copy: "FOUR sauce, house ranch, truffle mayo, the Bangkok glaze. Made in our own kitchens, never from a jar.",
    src: "/menu-items/ranchstar.jpg",
    alt: "Ranchstar smash burger with house ranch",
    fallback: "R",
  },
];

export function AboutCraft() {
  return (
    <>
      {/* ── 1 · Title band ── */}
      <PageTitleBand
        title="Our Food"
        tag="Smashed"
        tag2="Stuffed"
        lede="Every FOUR burger starts as a 110g ball of beef, smashed onto the griddle to order until the edges go lace-crisp. Every crown crust is stuffed by hand. Every sauce is ours."
      />

      {/* ── 2 · Photo pair ── */}
      <section className="wrap pt-10">
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <Reveal>
            <div className="f-media aspect-[4/3]">
              <SmartImage
                src="/about/burger-spread.jpg"
                alt="Three FOUR smash burgers plated in a row"
                fallbackLabel="F"
                className="h-full w-full"
                priority
              />
            </div>
          </Reveal>
          <Reveal delay={0.1} className="h-full">
            <div className="f-media aspect-[4/3] lg:aspect-auto lg:h-full">
              <SmartImage src="/home/craft-tray.jpg" alt="A FOUR tray of fries and a smash burger" fallbackLabel="O" className="h-full w-full" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 3 · Story header + stats ── */}
      <section className="wrap band--tight">
        <div className="grid items-start gap-10 lg:grid-cols-[200px_1fr]">
          <Reveal>
            <RotatingSeal className="w-40" />
          </Reveal>
          <Reveal delay={0.1}>
            <SectionHeader
              title="The smash is the whole religion"
              highlight="smash"
              tag="About"
              tag2="Kitchen"
              lede="Two patties on the Classic New York, American cheese, onion, pickles, FOUR sauce. The ball is pressed once and never again — that is the whole trick, and we do it to order, every time."
            />
            <div className="mt-8">
              <PillCta href="/menu">See the menu</PillCta>
            </div>
          </Reveal>
        </div>

        <ul role="list" className="mt-14 grid list-none grid-cols-2 gap-8 border-t border-rule p-0 pt-10 lg:grid-cols-4">
          {STATS.map((s) => (
            <li key={s.label}>
              <span className="block font-display text-6xl uppercase leading-none text-red">
                <StatNumber value={s.value} />
                {s.unit && <Hi>{s.unit}</Hi>}
              </span>
              <span className="mt-2 block text-sm font-medium text-ink-600">{s.label}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── 4 · Process beats ── */}
      <section className="wrap band--tight">
        <ol role="list" className="grid list-none gap-5 p-0 lg:grid-cols-3 lg:[&>*:nth-child(2)]:mt-24 lg:[&>*:nth-child(3)]:mt-48">
          {BEATS.map((b, i) => (
            <li key={b.no}>
              <Reveal delay={i * 0.1}>
                <div className="f-media aspect-[4/5]">
                  <SmartImage src={b.src} alt={b.alt} fallbackLabel={b.fallback} className="h-full w-full" />
                </div>
                <div className="mt-5 flex items-end justify-between gap-4">
                  <h3 className="f-heading f-heading--xs">{b.title}</h3>
                  <span className="f-ghost" aria-hidden>
                    {b.no}
                  </span>
                </div>
                <p className="mt-2 max-w-[36ch] text-ink-600">{b.copy}</p>
                {b.no === "02" && (
                  <Link href="/menu#cat-pizzas" className="f-btn f-btn--quiet mt-3">
                    See the pizza board →
                  </Link>
                )}
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      {/* ── 5 · The kitchens - the page's one red band ── */}
      <section className="on-red relative isolate">
        <DoodleBackdrop />
        <div className="wrap band relative z-[1]">
          <SectionHeader
            title={`Made fresh in ${BRANCHES.length} Lahore kitchens`}
            highlight="fresh"
            tag="Kitchens"
            lede={`${HOURS_LABEL}, every branch. Dough, sauces and prep done in-house daily.`}
          />
          <div className="mt-12 grid gap-px overflow-hidden rounded-[20px] bg-white/15 sm:grid-cols-3">
            {BRANCHES.map((b, i) => (
              <Reveal key={b.id} delay={i * 0.08} className="bg-red p-8">
                <span className="f-ghost" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="f-heading f-heading--sm mt-4">{b.shortName}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/75">{b.address}</p>
              </Reveal>
            ))}
          </div>
          <div className="mt-10">
            <PillCta href="/locations">Find your branch</PillCta>
          </div>
        </div>
      </section>

      {/* ── 6 · House sauces ── */}
      <section className="on-cream">
        <div className="wrap band">
          {/* The one scroll-scrubbed heading in the app. /about is a story page
              rather than part of the ordering funnel, and it is outside the
              design-sync export surface, which is what makes it the only place
              GSAP is allowed to land. */}
          <SectionHeader
            title={<FloatHeading text="If it's on the menu, we make it" />}
            tag="House sauces"
            lede="No jars, no shortcuts. Every sauce and dip is mixed in our own kitchens — here is where each one lives."
          />
          <ul role="list" className="mt-10 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3" aria-label="House sauces">
            {SCRATCH.map((s) => (
              <li key={s.sauce}>
                <Link
                  href={`/menu?item=${s.itemId}`}
                  className="f-card f-card--flat f-card--sm f-card--interactive flex items-center gap-4 p-4"
                  aria-label={`${s.sauce} - lives on the ${s.itemName}`}
                >
                  <div className="f-media f-media--r10 h-16 w-16 shrink-0">
                    <SmartImage
                      src={`/menu-items/${s.itemId}.jpg`}
                      alt={`${s.itemName}, carrying the ${s.sauce.toLowerCase()}`}
                      fallbackLabel={s.sauce}
                      className="h-full w-full"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="f-heading f-heading--xs block">{s.sauce}</span>
                    <span className="mt-1 block text-sm text-ink-600">Lives on the {s.itemName}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 7 · Closing photo card ── */}
      <section className="band">
        <div className="wrap">
          <Reveal>
            <div className="on-photo flex min-h-[420px] flex-col items-center justify-center overflow-hidden rounded-[20px] px-6 py-[90px] text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/gallery/gallery-1.jpg" alt="" loading="lazy" />
              <div className="relative z-[1] flex flex-col items-center">
                <SectionHeader as="p" align="center" title="Taste the difference." highlight="difference" />
                <p className="mt-5 text-base text-white">
                  From {formatPKR(Math.min(...MENU_ITEMS.map((i) => i.price)))}, delivered hot across Lahore.
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                  <PillCta href="/menu" size="lg">
                    Order now
                  </PillCta>
                  <PillCta href="/deals" arrow={false} size="lg">
                    Deals &amp; offers
                  </PillCta>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
