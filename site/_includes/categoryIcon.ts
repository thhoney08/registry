import type { ModManifest } from "../../mod.ts"

const categoryIcons: Record<string, string> = {
  sound: "/assets/category-sound.svg",
  graphics: "/assets/category-graphics.svg",
  graphical: "/assets/category-graphics.svg",
  vehicles: "/assets/category-vehicles.svg",
  items: "/assets/category-items.svg",
  item_exclude: "/assets/category-items.svg",
  creatures: "/assets/category-creatures.svg",
  monster_exclude: "/assets/category-creatures.svg",
  buildings: "/assets/category-buildings.svg",
  magical: "/assets/category-magical.svg",
  mutations: "/assets/category-mutations.svg",
  rebalance: "/assets/category-rebalance.svg",
  qol: "/assets/category-qol.svg",
  overhaul: "/assets/category-overhaul.svg",
  total_conversion: "/assets/category-overhaul.svg",
  content: "/assets/category-content.svg",
  misc_additions: "/assets/category-content.svg",
  misc: "/assets/category-content.svg",
}

export const resolveCategoryIconUrl = (manifest: Pick<ModManifest, "categories">): string => {
  const category = manifest.categories?.find((item) => categoryIcons[item])
  return category ? categoryIcons[category] : categoryIcons.content
}
