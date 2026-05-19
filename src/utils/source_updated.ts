import * as v from "valibot"
import type { ModManifest } from "../schema/manifest.ts"
import { fetchGitHubJson, getGitHubToken } from "./github_api_fetch.ts"
import { parseGitHubArchiveUrl } from "./github_archive.ts"

const GitHubCommitDate = v.object({
  commit: v.object({
    committer: v.object({ date: v.pipe(v.string(), v.isoTimestamp()) }),
  }),
})

export const buildGitHubCommitApiUrl = (manifest: ModManifest): string | undefined => {
  if (manifest.source.type !== "github_archive") return undefined

  const archive = parseGitHubArchiveUrl(manifest.source.url)
  if (!archive) return undefined

  return `https://api.github.com/repos/${archive.owner}/${archive.repo}/commits/${
    encodeURIComponent(manifest.source.commit_sha ?? archive.ref)
  }`
}

export type SourceUpdatedCache = Map<string, Promise<string | undefined>>

export const resolveSourceUpdatedAt = (
  manifest: ModManifest,
  cache: SourceUpdatedCache = new Map(),
): Promise<string | undefined> => {
  const apiUrl = buildGitHubCommitApiUrl(manifest)
  if (!apiUrl) return Promise.resolve(undefined)

  const cached = cache.get(apiUrl)
  if (cached) return cached

  const request = getGitHubToken()
    .then((token) =>
      fetchGitHubJson(apiUrl, GitHubCommitDate, {
        token,
        cache: new Map(),
        userAgent: "cata-bn-registry/1.0",
      })
    )
    .then((commit) => commit.commit.committer.date)
    .catch(() => undefined)

  cache.set(apiUrl, request)
  return request
}
