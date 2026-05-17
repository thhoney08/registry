import type { ModManifest } from "../schema/manifest.ts"
import {
  buildGitHubRawUrl,
  normalizeExtractPath,
  normalizeRawContentPath,
  parseGitHubArchiveUrl,
} from "./github_archive.ts"

type ModInfoResolutionFields = Pick<ModManifest, "modinfo_url" | "package_type" | "source">

export const resolveManifestModInfoCandidates = (manifest: ModInfoResolutionFields): string[] => {
  if (manifest.modinfo_url) return [manifest.modinfo_url]
  if (manifest.package_type === "soundpack" || manifest.source.type !== "github_archive") return []

  const parsed = parseGitHubArchiveUrl(manifest.source.url)
  if (!parsed) return []

  const extractPath = normalizeExtractPath(manifest.source.extract_path)
  const rawPath = normalizeRawContentPath(extractPath, parsed.repo)
  const pathPrefix = rawPath ? `${rawPath}/` : ""
  const ref = manifest.source.commit_sha ?? parsed.ref
  const archive = { ...parsed, ref }

  return [
    buildGitHubRawUrl(archive, `${pathPrefix}modinfo.json`),
    buildGitHubRawUrl(archive, `${pathPrefix}modinfo.json.json`),
  ]
}

export const resolveManifestModInfoUrl = (
  manifest: ModInfoResolutionFields,
): string | undefined => resolveManifestModInfoCandidates(manifest).at(0)
