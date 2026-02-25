import type { ModManifest } from "../schema/manifest.ts"

type IconResolutionFields = Pick<ModManifest, "icon_url" | "source">

export const WELL_KNOWN_ICON_EXTENSIONS = [
  "png",
  "svg",
  "webp",
  "avif",
  "jpg",
  "jpeg",
  "gif",
] as const

const normalizeExtractPath = (extractPath?: string): string => {
  if (!extractPath || extractPath === ".") return ""
  return extractPath.replace(/^\/+|\/+$/g, "")
}

const normalizeRawContentPath = (extractPath: string, repo: string): string => {
  if (!extractPath) return ""

  const [firstSegment, ...rest] = extractPath.split("/")
  if (firstSegment.toLowerCase().startsWith(`${repo.toLowerCase()}-`) && rest.length > 0) {
    return rest.join("/")
  }

  return extractPath
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
  return resolveManifestIconCandidates(manifest).at(0)
}

export const resolveManifestIconCandidates = (manifest: IconResolutionFields): string[] => {
  if (manifest.icon_url) return [manifest.icon_url]
  if (manifest.source.type !== "github_archive") return []

  const parsed = parseGitHubArchiveUrl(manifest.source.url)
  if (!parsed) return []

  const extractPath = normalizeExtractPath(manifest.source.extract_path)
  const rawPath = normalizeRawContentPath(extractPath, parsed.repo)
  const pathPrefix = rawPath ? `${rawPath}/` : ""
  const ref = manifest.source.commit_sha ?? parsed.ref

  const iconBase =
    `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${ref}/${pathPrefix}icon`

  return WELL_KNOWN_ICON_EXTENSIONS.map((ext) => `${iconBase}.${ext}`)
}
