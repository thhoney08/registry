import type { ModManifest } from "../schema/manifest.ts"
import {
  normalizeExtractPath,
  normalizeRawContentPath,
  parseGitHubArchiveUrl,
} from "./github_archive.ts"

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
