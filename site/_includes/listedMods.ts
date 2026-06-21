import { stripColorCodes } from "../../src/utils/color.ts"
import type { ModPageData } from "./types.ts"

export const getListedMods = (mods: ModPageData[]): ModPageData[] =>
  mods.filter((mod) => !mod.manifest.yanked)

const compareRecentMods = (a: ModPageData, b: ModPageData): number => {
  const dateA = a.sourceUpdatedAt ?? ""
  const dateB = b.sourceUpdatedAt ?? ""
  if (!dateA && !dateB) return stripColorCodes(a.title).localeCompare(stripColorCodes(b.title))
  if (!dateA) return 1
  if (!dateB) return -1
  return dateB.localeCompare(dateA)
}

export const getListedModSummary = (mods: ModPageData[], recentLimit = 6) => {
  const listedMods = getListedMods(mods)
  return {
    mods: listedMods,
    recentMods: listedMods.toSorted(compareRecentMods).slice(0, recentLimit),
  }
}
