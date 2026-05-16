import { assertEquals, assertThrows } from "@std/assert"
import * as v from "valibot"
import { ModManifest } from "./manifest.ts"

const baseManifest = {
  schema_version: "1.0",
  id: "test_package",
  display_name: "Test Package",
  short_description: "A test package",
  author: ["Tester"],
  license: "CC-BY-SA-4.0",
  version: "1.0.0",
  source: {
    type: "github_archive",
    url: "https://github.com/example/test/archive/refs/heads/main.zip",
  },
}

Deno.test("ModManifest - accepts soundpack package type", () => {
  const manifest = v.parse(ModManifest, {
    ...baseManifest,
    package_type: "soundpack",
    categories: ["sound"],
  })

  assertEquals(manifest.package_type, "soundpack")
})

Deno.test("ModManifest - rejects unknown package type", () => {
  assertThrows(() =>
    v.parse(ModManifest, {
      ...baseManifest,
      package_type: "tileset",
    })
  )
})
