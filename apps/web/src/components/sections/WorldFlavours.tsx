"use client";

/**
 * The menu's global-city naming system as Dinevo's tile grid: nine cream
 * tiles, one per city, the ninth on red for Lahore. Photo-free on purpose -
 * a typographic beat between two photo-heavy sections.
 */
import Link from "next/link";
import { MENU_ITEMS, formatPKR, type MenuItemData } from "@four/shared";
import { SectionHeader } from "../ds/SectionHeader";
import { PillCta } from "../ds/PillCta";
import { Reveal } from "../ds/Reveal";

// Fixed id list: city name -> the dish that carries it. A missing id renders
// nothing rather than lying.
const CITY_ITEMS: { city: string; itemId: string }[] = [
  { city: "New York", itemId: "classic-new-york" },
  { city: "London", itemId: "london-bbq" },
  { city: "Paris", itemId: "paris-truffle" },
  { city: "Texas", itemId: "texas-flamin-hot" },
  { city: "Bangkok", itemId: "bangkok-chipotle" },
  { city: "Cairo", itemId: "cairo-honey-mustard" },
  { city: "Vegas", itemId: "vegas-parm" },
  { city: "Mexico", itemId: "cheesy-mexico" },
];

const HOME_ITEM_ID = "lahori-fries";

const tile = "flex aspect-square flex-col justify-between rounded-[20px] p-4 transition-colors sm:p-5";

export function WorldFlavours() {
  const cells = CITY_ITEMS.map((c) => ({ ...c, item: MENU_ITEMS.find((i) => i.id === c.itemId) })).filter(
    (c): c is typeof c & { item: MenuItemData } => Boolean(c.item),
  );
  const home = MENU_ITEMS.find((i) => i.id === HOME_ITEM_ID);

  return (
    <section className="band">
      <div className="wrap grid items-center gap-12 lg:grid-cols-2">
        <div>
          <SectionHeader
            title="Big-city flavours. One Lahore address."
            highlight="Lahore"
            tag="The menu, mapped"
            tag2="One address"
            lede="Every burger on the board carries the city that inspired it. All of them are cooked here."
          />
          <div className="mt-8">
            <PillCta href="/menu#cat-smash-burgers">Explore all burgers</PillCta>
          </div>
        </div>

        <ul role="list" className="m-0 grid list-none grid-cols-3 gap-1 p-0">
          {cells.map(({ city, item }, i) => (
            <li key={item.id}>
              <Reveal delay={Math.min(i * 0.05, 0.3)}>
                <Link href={`/menu?item=${item.id}`} aria-label={`${item.name}, ${formatPKR(item.price)} - order it`} className={`${tile} bg-cream hover:bg-yellow`}>
                  <span className="font-display text-xl uppercase leading-none text-red sm:text-[1.75rem]">{city}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs text-ink-600 sm:text-sm">{item.name}</span>
                    <span className="block font-display text-base text-red">{formatPKR(item.price)}</span>
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
          {home && (
            <li>
              <Reveal delay={0.35}>
                <Link href={`/menu?item=${home.id}`} aria-label={`${home.name}, ${formatPKR(home.price)} - order it`} className={`${tile} on-red hover:bg-red-hover`}>
                  <span className="font-display text-xl uppercase leading-none text-white sm:text-[1.75rem]">Lahore</span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs text-white/80 sm:text-sm">{home.name}</span>
                    <span className="block font-display text-base text-yellow">{formatPKR(home.price)}</span>
                  </span>
                </Link>
              </Reveal>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
