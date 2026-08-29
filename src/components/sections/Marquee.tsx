/** Single kinetic strip between hero and menu. CSS-driven, pauses under reduced motion. */
export function Marquee() {
  const words = ["SMASH BURGERS", "CROWN CRUST PIZZAS", "LOADED FRIES", "THICK SHAKES", "CHEESE WINGS"];
  const row = words.map((w, i) => (
    <span key={i} className="mx-6 flex items-center gap-12">
      <span className="font-display text-2xl text-cream">{w}</span>
      <span className="h-2 w-2 rotate-45 bg-cream/40" aria-hidden />
    </span>
  ));
  return (
    <div className="overflow-hidden bg-red py-4" aria-hidden>
      <div className="flex w-max animate-marquee">
        <div className="flex shrink-0">{row}</div>
        <div className="flex shrink-0">{row}</div>
      </div>
    </div>
  );
}
