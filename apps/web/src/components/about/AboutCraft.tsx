"use client";

/**
 * The /about page body - the food-craft story in five beats:
 * hero thesis → the smash → the kitchens (the page's one red band) →
 * the crowns → the scratch rail of house sauces → closing CTA.
 * Every claim comes from menu data; every photo goes through SmartImage.
 * Patterns are the home page's: Story-style parallax collages, HypeBand's
 * red-band chassis, the f-gallery/f-work exhibition rail.
 */
import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { useReduceMotion } from "@/lib/useAnim";
import { BRANCHES, HOURS_LABEL, formatPKR, MENU_ITEMS } from "@four/shared";
import { SmartImage } from "../SmartImage";

const reveal = (reduce: boolean, delay = 0) => ({
  initial: reduce ? false : ({ opacity: 0, y: 24 } as const),
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
});

/** House sauces and where they live - names verbatim from menu descriptions. */
const SCRATCH: { sauce: string; itemId: string; itemName: string }[] = [
  { sauce: "FOUR Sauce", itemId: "classic-new-york", itemName: "Classic New York" },
  { sauce: "Bangkok Chilli Glaze", itemId: "bangkok-chipotle", itemName: "Bangkok Chipotle" },
  { sauce: "Truffle Mayo", itemId: "paris-truffle", itemName: "Paris Truffle" },
  { sauce: "Honey Mustard", itemId: "cairo-honey-mustard", itemName: "Cairo Honey Mustard" },
  { sauce: "House Ranch", itemId: "ranchstar", itemName: "Ranchstar" },
  { sauce: "Lotus Crumble", itemId: "lotus-shake", itemName: "Lotus Shake" },
];

export function AboutCraft() {
  const reduce = useReduceMotion();
  const smashRef = useRef<HTMLDivElement>(null);
  const crownRef = useRef<HTMLDivElement>(null);
  const smashScroll = useScroll({ target: smashRef, offset: ["start end", "end start"] });
  const crownScroll = useScroll({ target: crownRef, offset: ["start end", "end start"] });
  const yA = useTransform(smashScroll.scrollYProgress, [0, 1], reduce ? [0, 0] : [60, -60]);
  const yB = useTransform(smashScroll.scrollYProgress, [0, 1], reduce ? [0, 0] : [-40, 40]);
  const yC = useTransform(crownScroll.scrollYProgress, [0, 1], reduce ? [0, 0] : [50, -50]);
  const yD = useTransform(crownScroll.scrollYProgress, [0, 1], reduce ? [0, 0] : [-35, 35]);

  return (
    <>
      {/* ── 1 · Hero thesis ── */}
      <header className="wrap grid grid-cols-1 items-center gap-12 pb-20 pt-[calc(var(--bar-h)+2rem)] lg:grid-cols-2">
        <motion.div {...reveal(!!reduce)}>
          <p className="f-eyebrow">Our food</p>
          <h1 className="f-heading f-heading--xl">
            Smashed.
            <br />
            Stuffed.
            <br />
            <span className="text-red">Sauced.</span>
          </h1>
          <p className="f-lede">
            Every FOUR burger starts as a 110g ball of beef, smashed onto the griddle to order until the edges go
            lace-crisp. Every crown crust is stuffed by hand. Every sauce is ours.
          </p>
        </motion.div>
        <motion.div {...reveal(!!reduce, 0.1)}>
          <div className="f-media aspect-[4/3]">
            <SmartImage
              src="/about/burger-spread.jpg"
              alt="Three FOUR smash burgers plated in a row"
              fallbackLabel="F"
              className="h-full w-full"
            />
          </div>
        </motion.div>
      </header>

      {/* ── 2 · The smash ── */}
      <section ref={smashRef} className="overflow-hidden bg-[var(--bg-page-alt)] py-24">
        <div className="wrap grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <motion.div {...reveal(!!reduce)}>
            <p className="f-eyebrow">The smash</p>
            <h2 className="f-heading f-heading--lg">
              110 grams. Lace edges. <span className="text-red">No shortcuts.</span>
            </h2>
            <p className="f-lede">
              The ball hits a screaming-hot plate and gets pressed once, hard. More crust, more flavour, no grey
              middle — that&apos;s the whole religion. Two patties on the Classic New York, American cheese, onion,
              pickles, FOUR sauce.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <span className="f-tag f-tag--muted">110g / patty</span>
              <span className="f-tag f-tag--muted">Smashed to order</span>
              <span className="f-tag f-tag--muted">Open till 3 am</span>
            </div>
          </motion.div>
          <div className="relative grid grid-cols-2 gap-4 sm:gap-5">
            <motion.div style={{ y: yA }} className="mt-8">
              <div className="f-media aspect-[3/4]">
                <SmartImage
                  src="/menu-items/texas-flamin-hot.jpg"
                  alt="Texas Flamin Hot smash burger, crust up close"
                  fallbackLabel="F"
                  className="h-full w-full"
                />
              </div>
            </motion.div>
            <motion.div style={{ y: yB }}>
              <div className="f-media aspect-[3/4]">
                <SmartImage
                  src="/menu-items/paris-truffle.jpg"
                  alt="Paris Truffle smash burger"
                  fallbackLabel="O"
                  className="h-full w-full"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 3 · The kitchens - the page's one red band ── */}
      <section className="on-red">
        <div className="wrap py-24">
          <motion.h2 {...reveal(!!reduce)} className="f-heading f-heading--lg max-w-[18ch]">
            Made fresh in three Lahore kitchens.
          </motion.h2>
          <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-card border border-rule-white bg-rule-white sm:grid-cols-3">
            {BRANCHES.map((b, i) => (
              <motion.div key={b.id} {...reveal(!!reduce, i * 0.08)} className="bg-red p-8">
                <span className="font-display text-6xl text-white/25">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-4 font-display text-2xl uppercase">{b.shortName}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/75">{b.address}</p>
              </motion.div>
            ))}
          </div>
          <motion.p {...reveal(!!reduce, 0.15)} className="mt-6 text-sm font-semibold text-white/80">
            {HOURS_LABEL}, every branch. Dough, sauces and prep done in-house daily.
          </motion.p>
          <motion.div {...reveal(!!reduce, 0.2)} className="mt-8">
            <Link href="/locations" className="f-btn f-btn--cream f-btn--lg">
              Find your branch
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── 4 · The crowns ── */}
      <section ref={crownRef} className="wrap overflow-hidden py-24">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="relative order-2 grid grid-cols-2 gap-4 sm:gap-5 lg:order-1">
            <motion.div style={{ y: yC }}>
              <div className="f-media aspect-[3/4]">
                <SmartImage
                  src="/menu-items/malai-boti-crown-red.jpg"
                  alt="Malai boti crown crust pizza, the stuffed ring up close"
                  fallbackLabel="U"
                  className="h-full w-full"
                />
              </div>
            </motion.div>
            <motion.div style={{ y: yD }} className="mt-8">
              <div className="f-media aspect-[3/4]">
                <SmartImage
                  src="/menu-items/seekh-kebab-crust.jpg"
                  alt="Seekh kebab crust pizza"
                  fallbackLabel="R"
                  className="h-full w-full"
                />
              </div>
            </motion.div>
          </div>
          <motion.div {...reveal(!!reduce)} className="order-1 lg:order-2">
            <p className="f-eyebrow">The pizzas</p>
            <h2 className="f-heading f-heading--lg">
              Crown crusts, stuffed <span className="text-red">by hand.</span>
            </h2>
            <p className="f-lede">
              Hand-stretched, from cheese burst to seekh kebab crust. The crown is rolled, stuffed — cheese, malai
              boti, seekh kebab — and sealed every morning, so the last bite beats the first.
            </p>
            <Link href="/menu#cat-pizzas" className="f-btn f-btn--quiet f-btn--sm mt-6">
              See the pizza board →
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── 5 · The scratch rail ── */}
      <section className="bg-[var(--bg-page-alt)] py-24">
        <div className="wrap">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="f-eyebrow">House sauces &amp; sides</p>
              <h2 className="f-heading f-heading--lg">If it&apos;s on the menu, we make it</h2>
            </div>
            <span className="f-tag f-tag--muted hidden sm:inline-flex">No jars. No shortcuts.</span>
          </div>
          <div className="f-gallery" role="list" aria-label="House sauces">
            {SCRATCH.map((s, i) => (
              <motion.div
                key={s.sauce}
                role="listitem"
                className="w-[min(70vw,16rem)] shrink-0 snap-center"
                initial={reduce ? false : { opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.55, delay: Math.min(i * 0.06, 0.3), ease: [0.16, 1, 0.3, 1] }}
              >
                <Link href={`/menu?item=${s.itemId}`} className="f-work" aria-label={`${s.sauce} - lives on the ${s.itemName}`}>
                  <div className="f-work__frame aspect-square">
                    <SmartImage
                      src={`/menu-items/${s.itemId}.jpg`}
                      alt={`${s.itemName}, carrying the ${s.sauce.toLowerCase()}`}
                      fallbackLabel={s.sauce}
                      className="h-full w-full"
                    />
                  </div>
                  <div className="f-work__plate">
                    <div>
                      <span className="f-work__title text-xl">{s.sauce}</span>
                      <span className="f-work__meta">Lives on the {s.itemName}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6 · Closing CTA ── */}
      <section className="wrap py-24">
        <motion.div {...reveal(!!reduce)} className="f-card f-card--inverse overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-8 p-10 sm:p-14">
            <div>
              <h2 className="f-heading f-heading--lg">Taste the difference.</h2>
              <p className="mt-3 max-w-[44ch] text-white/70">
                From {formatPKR(Math.min(...MENU_ITEMS.map((i) => i.price)))}, delivered hot across Lahore.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/menu" className="f-btn f-btn--primary f-btn--lg">
                Order now
              </Link>
              <Link href="/deals" className="f-btn f-btn--on-red f-btn--lg">
                Deals &amp; offers
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </>
  );
}
