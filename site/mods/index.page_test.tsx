import { assertEquals } from "@std/assert"
import type { ModManifest } from "../../mod.ts"
import { groupModsByParent } from "./index.page.tsx"
import type { ModPageData } from "../_includes/types.ts"

const mod = (id: string, parent?: string): ModPageData => ({
  url: `/mods/${id}/`,
  title: id,
  manifest: { id, parent } as ModManifest,
})

Deno.test("groupModsByParent renders submods with missing parents as standalone cards", () => {
  const groups = groupModsByParent([
    mod("parent"),
    mod("child", "parent"),
    mod("orphan", "missing"),
  ])

  assertEquals(groups.map((group) => group.main.manifest.id).sort(), ["orphan", "parent"])
  assertEquals(
    groups.find((group) => group.main.manifest.id === "parent")?.submods.map((item) =>
      item.manifest.id
    ),
    ["child"],
  )
  assertEquals(groups.find((group) => group.main.manifest.id === "orphan")?.submods, [])
})
