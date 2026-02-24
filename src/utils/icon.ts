import type { ModManifest } from "../schema/manifest.ts"

type IconResolutionFields = Pick<ModManifest, "icon_url" | "source">

const normalizeExtractPath = (extractPath?: string): string => {
  if (!extractPath || extractPath === ".") return ""
  return extractPath.replace(/^\/+|\/+$/g, "")
}

const parseGitHubArchiveUrl = (
  archiveUrl: string,
): { owner: string; repo: string; ref: string } | null => {
  const match = archiveUrl.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/archive\/refs\/(heads|tags)\/(.+)\.zip$/i,
  )
  if (!match) return null

  return {
    owner: match[1],
    repo: match[2],
    ref: decodeURIComponent(match[4]),
  }
}

export const resolveManifestIconUrl = (manifest: IconResolutionFields): string | undefined => {
  if (manifest.icon_url) return manifest.icon_url
  if (manifest.source.type !== "github_archive") return undefined

  const parsed = parseGitHubArchiveUrl(manifest.source.url)
  if (!parsed) return undefined

  const extractPath = normalizeExtractPath(manifest.source.extract_path)
  const pathPrefix = extractPath ? `${extractPath}/` : ""
  const ref = manifest.source.commit_sha ?? parsed.ref

  return `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${ref}/${pathPrefix}icon.png`
}
