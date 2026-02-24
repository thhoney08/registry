import { assertEquals, assertStrictEquals } from "@std/assert"
import type { ModManifest } from "../schema/manifest.ts"
import { applyLastUpdatedFallback } from "./generate.ts"

const createManifest = (overrides: Partial<ModManifest> = {}): ModManifest => ({
  schema_version: "1.0",
  id: "example_mod",
  display_name: "Example Mod",
  short_description: "Example description",
  author: ["Example Author"],
  license: "MIT",
  version: "1.0.0",
  source: {
    type: "github_archive",
    url: "https://github.com/example/repo/archive/refs/heads/main.zip",
  },
  ...overrides,
})

Deno.test("applyLastUpdatedFallback keeps existing manifest last_updated", () => {
  const manifest = createManifest({ last_updated: "2026-02-25T00:00:00.000Z" })
  const result = applyLastUpdatedFallback(manifest, "2026-02-25T04:00:00+09:00")

  assertStrictEquals(result, manifest)
  assertEquals(result.last_updated, "2026-02-25T00:00:00.000Z")
})

Deno.test("applyLastUpdatedFallback uses git timestamp when missing", () => {
  const manifest = createManifest()
  const result = applyLastUpdatedFallback(manifest, "2026-02-25T04:00:00+09:00")

  assertEquals(result.last_updated, "2026-02-25T04:00:00+09:00")
})

Deno.test("applyLastUpdatedFallback uses clock fallback when git timestamp missing", () => {
  const manifest = createManifest()
  const result = applyLastUpdatedFallback(manifest, undefined, () => "2026-02-25T12:34:56.000Z")

  assertEquals(result.last_updated, "2026-02-25T12:34:56.000Z")
})
