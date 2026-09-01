import type { MenuItemView } from "./ItemModal";

/** Category shape served by GET /api/menu, shared by the ordering page and the home teaser. */
export interface MenuCategoryView {
  id: string;
  label: string;
  blurb: string;
  boardImage: string;
  items: MenuItemView[];
}
