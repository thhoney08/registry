import { assertEquals } from "@std/assert"
import type { ModManifest } from "../../schema/manifest.ts"
import { shouldSkipManifestWrite } from "./fetch.ts"

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

Deno.test("shouldSkipManifestWrite skips unchanged manifests with existing last_updated", () => {
  const existing = createManifest({ last_updated: "2026-02-25T00:00:00.000Z" })
  const generated = createManifest({ last_updated: "2026-02-25T12:00:00.000Z" })

  assertEquals(shouldSkipManifestWrite(existing, generated), true)
})

Deno.test("shouldSkipManifestWrite does not skip when existing manifest lacks last_updated", () => {
  const existing = createManifest()
  const generated = createManifest({ last_updated: "2026-02-25T12:00:00.000Z" })

  assertEquals(shouldSkipManifestWrite(existing, generated), false)
})
