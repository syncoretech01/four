/**
 * Menu-item sticker tags, priority-ordered (bestseller > signature > new >
 * spicy), capped at two so cards never wear a full sash. Shared by the item
 * card and the item modal. All four are the straight `--card` sticker that
 * sits 20px/20px inside the media block: bestseller yellow, signature and
 * spicy red, new white.
 */
export function tagBadges(tags: string[]): { label: string; cls: string }[] {
  const out: { label: string; cls: string }[] = [];
  if (tags.includes("bestseller")) out.push({ label: "Bestseller", cls: "f-tag f-tag--card" });
  if (tags.includes("signature")) out.push({ label: "Signature", cls: "f-tag f-tag--red f-tag--card" });
  if (tags.includes("new")) out.push({ label: "New", cls: "f-tag f-tag--white f-tag--card" });
  if (tags.includes("spicy")) out.push({ label: "Spicy", cls: "f-tag f-tag--red f-tag--card" });
  return out.slice(0, 2);
}

export function TagStack({ tags, className = "" }: { tags: string[]; className?: string }) {
  const badges = tagBadges(tags);
  if (badges.length === 0) return null;
  return (
    <div className={`flex flex-col items-start gap-1.5 ${className}`}>
      {badges.map((b) => (
        <span key={b.label} className={b.cls}>
          {b.label}
        </span>
      ))}
    </div>
  );
}
