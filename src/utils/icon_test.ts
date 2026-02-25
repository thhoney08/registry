import { assertEquals } from "@std/assert"
import { resolveManifestIconUrl } from "./icon.ts"

Deno.test("resolveManifestIconUrl - preserves explicit icon_url", () => {
  const iconUrl = resolveManifestIconUrl({
    icon_url: "https://example.com/custom-icon.png",
    source: {
      type: "github_archive",
      url: "https://github.com/org/repo/archive/refs/heads/main.zip",
    },
  })

  assertEquals(iconUrl, "https://example.com/custom-icon.png")
})

Deno.test("resolveManifestIconUrl - falls back using commit and extract path", () => {
  const iconUrl = resolveManifestIconUrl({
    source: {
      type: "github_archive",
      url: "https://github.com/NobleJake/ProjectPackRat/archive/refs/heads/main.zip",
      commit_sha: "8682733b32eda1b463e9ea58245aaae68cd1a733",
      extract_path: "ProjectSquirrel",
    },
  })

  assertEquals(
    iconUrl,
    "https://raw.githubusercontent.com/NobleJake/ProjectPackRat/8682733b32eda1b463e9ea58245aaae68cd1a733/ProjectSquirrel/icon.png",
  )
})

Deno.test("resolveManifestIconUrl - strips archive root directory in extract path", () => {
  const iconUrl = resolveManifestIconUrl({
    source: {
      type: "github_archive",
      url:
        "https://github.com/cataclysmroguelikegallery/Cata-Rogall-Modpack/archive/refs/heads/main.zip",
      commit_sha: "508d3ebb020e656edc7b01de29118e51061e181b",
      extract_path: "Cata-Rogall-Modpack-main/BN/ER_cosplay",
    },
  })

  assertEquals(
    iconUrl,
    "https://raw.githubusercontent.com/cataclysmroguelikegallery/Cata-Rogall-Modpack/508d3ebb020e656edc7b01de29118e51061e181b/BN/ER_cosplay/icon.png",
  )
})

Deno.test("resolveManifestIconUrl - falls back at repository root", () => {
  const iconUrl = resolveManifestIconUrl({
    source: {
      type: "github_archive",
      url: "https://github.com/owner/repo/archive/refs/heads/main.zip",
    },
  })

  assertEquals(iconUrl, "https://raw.githubusercontent.com/owner/repo/main/icon.png")
})

Deno.test("resolveManifestIconUrl - handles dot extract path", () => {
  const iconUrl = resolveManifestIconUrl({
    source: {
      type: "github_archive",
      url: "https://github.com/owner/repo/archive/refs/heads/main.zip",
      extract_path: ".",
    },
  })

  assertEquals(iconUrl, "https://raw.githubusercontent.com/owner/repo/main/icon.png")
})

Deno.test("resolveManifestIconUrl - returns undefined for non-github sources", () => {
  const iconUrl = resolveManifestIconUrl({
    source: {
      type: "direct_url",
      url: "https://example.com/mod.zip",
    },
  })

  assertEquals(iconUrl, undefined)
})

Deno.test("resolveManifestIconUrl - returns undefined for unsupported archive URL", () => {
  const iconUrl = resolveManifestIconUrl({
    source: {
      type: "github_archive",
      url: "https://github.com/owner/repo/releases/latest/download/mod.zip",
    },
  })

  assertEquals(iconUrl, undefined)
})
