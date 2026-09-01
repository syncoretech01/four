/**
 * Menu-item tag badges, priority-ordered (bestseller > signature > new >
 * spicy), capped at two so cards never wear a full sash. Shared by the item
 * card and the item modal.
 */
export function tagBadges(tags: string[]): { label: string; cls: string }[] {
  const out: { label: string; cls: string }[] = [];
  if (tags.includes("bestseller")) out.push({ label: "Bestseller", cls: "f-badge f-badge--accent" });
  if (tags.includes("signature")) out.push({ label: "Signature", cls: "f-badge" });
  if (tags.includes("new")) out.push({ label: "New", cls: "f-badge f-badge--success" });
  if (tags.includes("spicy")) out.push({ label: "Spicy", cls: "f-badge f-badge--soft" });
  return out.slice(0, 2);
}

export function TagStack({ tags, className = "" }: { tags: string[]; className?: string }) {
  const badges = tagBadges(tags);
  if (badges.length === 0) return null;
  return (
    <div className={`flex flex-col items-start gap-1.5 ${className}`}>
      {badges.map((b, i) => (
        <span key={b.label} className={`${b.cls} ${i % 2 ? "rotate-2" : "-rotate-3"}`}>
          {b.label}
        </span>
      ))}
    </div>
  );
}
