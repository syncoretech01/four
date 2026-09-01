"use client";

/**
 * The menu's global-city naming system, surfaced as a typographic stamp
 * grid - the honest version of a chain's "everywhere" claim: the MENU is
 * the world tour, the address is Lahore, stated proudly in the ninth cell.
 * Deliberately photo-free so it reads as a campaign beat between the two
 * photo-heavy sections around it.
 */
import Link from "next/link";
import { motion } from "motion/react";
import { useReduceMotion } from "@/lib/useAnim";
import { MENU_ITEMS, formatPKR, type MenuItemData } from "@four/shared";

// Fixed id list: city name -> the dish that carries it. A missing id renders
// nothing rather than lying, but items() below throws in dev via the filter.
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

function tagBadge(item: MenuItemData) {
  if (item.tags?.includes("signature")) return { label: "Signature", cls: "f-badge" };
  if (item.tags?.includes("spicy")) return { label: "Spicy", cls: "f-badge f-badge--soft" };
  return null;
}

export function WorldFlavours() {
  const reduce = useReduceMotion();
  const cells = CITY_ITEMS.map((c) => ({ ...c, item: MENU_ITEMS.find((i) => i.id === c.itemId) })).filter(
    (c): c is typeof c & { item: MenuItemData } => Boolean(c.item),
  );
  const home = MENU_ITEMS.find((i) => i.id === HOME_ITEM_ID);

  return (
    <section className="wrap band">
      <div className="max-w-3xl">
        <p className="f-eyebrow">The menu, mapped</p>
        <h2 className="f-heading f-heading--lg sm:text-6xl">
          Big-city flavours.
          <br />
          One Lahore <span className="text-red">address.</span>
        </h2>
        <p className="f-lede">
          Every burger on the board carries the city that inspired it. All of them are cooked here.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3">
        {cells.map(({ city, item }, i) => {
          const badge = tagBadge(item);
          return (
            <motion.div
              key={item.id}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: Math.min(i * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={`/menu?item=${item.id}`}
                className="f-card f-card--interactive flex h-full flex-col justify-between gap-6 p-5 sm:p-6"
                aria-label={`${item.name}, ${formatPKR(item.price)} - order it`}
              >
                <span className="font-display text-3xl font-bold uppercase leading-[0.9] text-ink-900 sm:text-4xl lg:text-5xl">
                  {city}
                </span>
                <span className="flex items-end justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-ink-900">{item.name}</span>
                    <span className="block font-display text-lg font-bold text-red">{formatPKR(item.price)}</span>
                  </span>
                  {badge && <span className={`${badge.cls} shrink-0 -rotate-2`}>{badge.label}</span>}
                </span>
              </Link>
            </motion.div>
          );
        })}

        {home && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="col-span-2 md:col-span-1"
          >
            <Link
              href={`/menu?item=${home.id}`}
              className="f-card f-card--accent f-card--interactive flex h-full flex-col justify-between gap-6 p-5 sm:p-6"
              aria-label={`${home.name}, ${formatPKR(home.price)} - order it`}
            >
              <span className="font-display text-3xl font-bold uppercase leading-[0.9] !text-[var(--paper-0)] sm:text-4xl lg:text-5xl">
                Lahore
              </span>
              <span className="flex items-end justify-between gap-2">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold !text-[var(--paper-0)]">{home.name}</span>
                  <span className="block font-display text-lg font-bold text-cream/85">{formatPKR(home.price)}</span>
                </span>
                <span className="shrink-0 text-xs font-extrabold uppercase tracking-[0.1em] text-cream/85">
                  ...and home
                </span>
              </span>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
