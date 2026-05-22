import { assertEquals, assertThrows } from "@std/assert"
import * as v from "valibot"
import { completedDependencies, ModManifest, ModManifestWithDefaults } from "./manifest.ts"

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

Deno.test("ModManifest - accepts game mod IDs with uppercase and spaces", () => {
  const manifest = v.parse(ModManifest, {
    ...baseManifest,
    id: "XE038 Patch",
    dependencies: { "Sudo Requiem": ">=1.0.0" },
  })

  assertEquals(manifest.id, "XE038 Patch")
  assertEquals(manifest.dependencies?.["Sudo Requiem"], ">=1.0.0")
})

Deno.test("ModManifestWithDefaults - skips incomplete or invalid dependency rows", () => {
  const dependencies = completedDependencies([
    ["bn", ">=0.9.1"],
    ["", ""],
    ["XE038", ""],
    ["broken", ">"],
  ])
  const manifest = v.parse(ModManifestWithDefaults, {
    ...baseManifest,
    dependencies: Object.fromEntries(dependencies),
  })

  assertEquals(manifest.dependencies, { bn: ">=0.9.1" })
})

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

Deno.test("ModManifest - accepts Lua metadata", () => {
  const manifest = v.parse(ModManifest, {
    ...baseManifest,
    modinfo_url: "https://raw.githubusercontent.com/example/test/main/modinfo.json",
    uses_lua: true,
    lua_api_version: 2,
  })

  assertEquals(manifest.uses_lua, true)
  assertEquals(manifest.lua_api_version, 2)
})
