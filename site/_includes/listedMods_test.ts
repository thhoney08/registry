import { assertEquals } from "@std/assert"
import type { ModManifest } from "../../mod.ts"
import { getListedModSummary } from "./listedMods.ts"
import type { ModPageData } from "./types.ts"

const mod = (
  id: string,
  sourceUpdatedAt: string,
  overrides: Partial<ModManifest> = {},
): ModPageData => ({
  url: `/mods/${id}/`,
  title: id,
  sourceUpdatedAt,
  manifest: {
    id,
    display_name: id,
    short_description: id,
    author: ["test"],
    version: "1.0.0",
    source: { type: "github_archive", url: "https://github.com/test/mod/archive/main.zip" },
    ...overrides,
  } as ModManifest,
})

Deno.test("getListedModSummary excludes yanked mods from counts and recent mods", () => {
  const result = getListedModSummary([
    mod("active-old", "2024-01-01T00:00:00Z"),
    mod("yanked-new", "2026-01-01T00:00:00Z", { yanked: { reason: "mainlined" } }),
    mod("active-new", "2025-01-01T00:00:00Z"),
  ])

  assertEquals(result.mods.map((item) => item.manifest.id), ["active-old", "active-new"])
  assertEquals(result.recentMods.map((item) => item.manifest.id), ["active-new", "active-old"])
})
