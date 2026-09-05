/**
 * The craft story as Dinevo's "about" beat: a red thumb card with the crown
 * photo, the rotating seal and a stat strip on the left; the thesis, a
 * checklist of the method and a second photo on the right. Keeps id="story"
 * so old /#story anchors still land. Every figure is imported.
 */
import { BRANCHES, HOURS_LABEL } from "@four/shared";
import { SmartImage } from "../SmartImage";
import { RotatingSeal } from "../hero/RotatingSeal";
import { SectionHeader } from "../ds/SectionHeader";
import { StatNumber } from "../ds/StatNumber";
import { PillCta } from "../ds/PillCta";
import { Reveal } from "../ds/Reveal";

const METHOD = [
  { name: "The smash", copy: "110g, smashed to order, never off a warming rack. The lace edge is the proof." },
  { name: "The crown", copy: "Pizza crusts rolled and stuffed by hand — cheese, malai boti, seekh kebab — sealed every morning." },
  { name: "The sauce", copy: "FOUR sauce and every dip built from scratch in our own kitchens. No jars, no shortcuts." },
  { name: "The hours", copy: `${HOURS_LABEL}. The 2am order is a Lahore tradition — we honour it.` },
];

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="mt-1 shrink-0 text-red">
      <path d="M4 12.5l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CraftStory() {
  return (
    <section id="story" className="band">
      <div className="wrap">
        <div className="grid items-start gap-12 border-t border-rule pt-12 lg:grid-cols-[600px_1fr] lg:gap-[120px] lg:pt-16">
          <Reveal>
            <div className="on-red overflow-hidden rounded-[20px]">
              <div className="relative">
                <div className="f-media aspect-[4/3] rounded-none">
                  <SmartImage src="/home/craft-crown.jpg" alt="A hand-stuffed crown crust pizza" fallbackLabel="U" className="h-full w-full" />
                </div>
                <RotatingSeal className="absolute bottom-[-80px] left-1/2 w-40 -translate-x-1/2" />
              </div>
              <div className="grid grid-cols-[auto_1fr] items-center gap-6 p-8 pt-[100px]">
                <span className="font-display text-[5rem] leading-none text-yellow" aria-hidden>
                  <StatNumber value={BRANCHES.length} />
                </span>
                <div>
                  <span className="block text-sm font-medium uppercase tracking-[0.08em] text-white/80">
                    <span className="sr-only">{BRANCHES.length} </span>kitchens across Lahore
                  </span>
                  <span className="mt-2 block font-display text-[1.375rem] uppercase leading-tight text-yellow">
                    110g patties, crown crusts and every sauce — made from scratch, every day.
                  </span>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <SectionHeader
              title="The smash is the recipe."
              highlight="smash"
              tag="Our food"
              tag2="From scratch"
              lede="Every burger starts as a hand-rolled 110g ball of beef. It hits a screaming-hot plate, gets pressed once — hard — and comes off with an edge you can hear. We refuse to skip that step, so you get to taste it."
            />
            <ul role="list" className="mt-8 grid list-none gap-3 border-t border-rule p-0 pt-8">
              {METHOD.map((m) => (
                <li key={m.name} className="flex gap-3 text-ink-900">
                  <Check />
                  <span>
                    <strong className="font-semibold">{m.name}.</strong> {m.copy}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap items-end gap-8">
              <div className="f-media f-media--hover aspect-[4/5] w-[200px] lg:w-[240px]">
                <SmartImage src="/home/craft-smash.jpg" alt="A FOUR smash burger, the patty's lace-crisp edge in focus" fallbackLabel="F" className="h-full w-full" />
              </div>
              <PillCta href="/about">Our food</PillCta>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
