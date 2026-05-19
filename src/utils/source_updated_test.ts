import { assertEquals } from "@std/assert"
import type { ModManifest } from "../schema/manifest.ts"
import { buildGitHubCommitApiUrl } from "./source_updated.ts"

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
    commit_sha: "0123456789abcdef0123456789abcdef01234567",
  },
  ...overrides,
})

Deno.test("buildGitHubCommitApiUrl uses pinned source commit", () => {
  assertEquals(
    buildGitHubCommitApiUrl(createManifest()),
    "https://api.github.com/repos/example/repo/commits/0123456789abcdef0123456789abcdef01234567",
  )
})

Deno.test("buildGitHubCommitApiUrl falls back to archive ref", () => {
  assertEquals(
    buildGitHubCommitApiUrl(createManifest({
      source: {
        type: "github_archive",
        url: "https://github.com/example/repo/archive/refs/tags/v1.2.3.zip",
      },
    })),
    "https://api.github.com/repos/example/repo/commits/v1.2.3",
  )
})

Deno.test("buildGitHubCommitApiUrl skips non-GitHub archives", () => {
  assertEquals(
    buildGitHubCommitApiUrl(createManifest({
      source: {
        type: "direct_url",
        url: "https://example.com/mod.zip",
      },
    })),
    undefined,
  )
})
