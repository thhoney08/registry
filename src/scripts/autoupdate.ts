#!/usr/bin/env -S deno run --allow-read --allow-write --allow-net --allow-env
/**
 * Autoupdate script for mod manifests.
 * Checks for new versions and updates manifests accordingly.
 */

import { Command } from "@cliffy/command"
import { stringify } from "@std/yaml/unstable-stringify"
import * as YAML from "@std/yaml"
import { walk } from "@std/fs"
import { canParse, compare as compareSemVer, tryParse } from "@std/semver"
import { join } from "@std/path"
import { type ModManifest, ModManifest as ModManifestSchema } from "../schema/manifest.ts"
import { checkUrl } from "../utils/url_checker.ts"
import { GitHubCommitResponse, GitHubTagsResponse } from "../schema/github_api.ts"
import { extractRepoUrl as extractRepoUrlFromString, parseGitHubUrl } from "../utils/github.ts"
import { fetchGitHubJson, getGitHubToken } from "../utils/github_api_fetch.ts"
import * as v from "valibot"

const GITHUB_USER_AGENT = "BN-Mod-Registry/1.0"
const githubToken = await getGitHubToken()
const githubApiCache = new Map<string, unknown>()
let warnedMissingToken = false

const warnIfMissingToken = () => {
  if (warnedMissingToken) return
  if (githubToken) return
  warnedMissingToken = true
  console.warn(
    "GitHub token not found (set GITHUB_TOKEN or GH_TOKEN). Requests may be rate-limited.",
  )
}

type TagInfo = {
  name: string
  sha: string
}

type LatestVersionInfo = {
  version: string
  substitutionVersion: string
  commitSha?: string
}

const normalizeToSemVer = (raw: string): string | null => {
  const stripped = raw.replace(/^[vV]/, "")

  const match = stripped.match(/^([^+-]+)([-+].*)?$/)
  if (!match) return null

  const main = match[1]
  const suffix = match[2] ?? ""

  const parts = main.split(".")
  if (parts.length !== 3) return null
  if (!parts.every((p) => /^\d+$/.test(p))) return null

  const normalizedMain = parts
    .map((p) => (p.length > 1 && p.startsWith("0")) ? String(Number(p)) : p)
    .join(".")

  return `${normalizedMain}${suffix}`
}

/**
 * Load .manifestignore file and return list of ignored mod patterns.
 * Format: {repo url}/{mod id} per line.
 * Lines starting with # are comments.
 */
const loadManifestIgnore = async (dir: string): Promise<Set<string>> => {
  const ignorePath = join(dir, ".manifestignore")
  const ignored = new Set<string>()

  try {
    const content = await Deno.readTextFile(ignorePath)
    for (const line of content.split("\n")) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith("#")) {
        ignored.add(trimmed.toLowerCase())
      }
    }
  } catch {
    // File doesn't exist or can't be read, that's ok
  }

  return ignored
}

/**
 * Check if a manifest should be ignored during autoupdate.
 * @param manifest The manifest to check
 * @param ignored Set of ignored patterns from .manifestignore
 * @returns true if the manifest should be skipped
 */
const shouldIgnoreManifest = (manifest: ModManifest, ignored: Set<string>): boolean => {
  if (ignored.size === 0) return false

  // Get repo info from homepage or source URL
  const repoUrl = manifest.homepage ?? extractRepoUrl(manifest)
  if (!repoUrl) return false

  const repoInfo = parseGitHubUrl(repoUrl)
  if (!repoInfo) return false

  // Build the ignore pattern: github.com/owner/repo/mod_id
  const pattern = `github.com/${repoInfo.owner}/${repoInfo.repo}/${manifest.id}`.toLowerCase()

  return ignored.has(pattern)
}

/**
 * Get the latest version from a GitHub repository.
 * Supports tag-based and commit-based versioning.
 */
export const getLatestVersion = (
  manifest: ModManifest,
): Promise<string | null> => {
  return getLatestVersionInfo(manifest).then((info) => info?.version ?? null)
}

/**
 * Extract repository URL from manifest source URL.
 * Uses shared utility for URL parsing.
 */
const extractRepoUrl = (manifest: ModManifest): string | null =>
  extractRepoUrlFromString(manifest.source.url)

const getLatestVersionInfo = async (
  manifest: ModManifest,
): Promise<LatestVersionInfo | null> => {
  const autoupdate = manifest.autoupdate
  if (!autoupdate) return null

  const updateUrl = autoupdate.update_url ?? manifest.homepage ?? extractRepoUrl(manifest)
  if (!updateUrl) return null

  const repoInfo = parseGitHubUrl(updateUrl)
  if (!repoInfo) return null

  if (autoupdate.type === "tag") {
    return await getLatestTagInfo(repoInfo.owner, repoInfo.repo, autoupdate.regex)
  }

  if (autoupdate.type === "commit") {
    return await getLatestCommitInfo(
      repoInfo.owner,
      repoInfo.repo,
      autoupdate.branch ?? "main",
    )
  }

  return null
}

const getLatestTagInfo = async (
  owner: string,
  repo: string,
  regex?: string,
): Promise<LatestVersionInfo | null> => {
  const tags = await getAllTags(owner, repo, regex)
  if (!tags || tags.length === 0) return null

  const candidates = tags
    .map((t) => ({
      tag: t,
      version: normalizeToSemVer(t.name),
    }))
    .filter((t): t is { tag: TagInfo; version: string } => typeof t.version === "string")
    .filter((t) => canParse(t.version))

  if (candidates.length === 0) return null

  candidates.sort((a, b) => {
    const va = tryParse(a.version)
    const vb = tryParse(b.version)
    if (va && vb) return compareSemVer(vb, va)
    return a.version.localeCompare(b.version)
  })

  const latest = candidates[0]
  return {
    version: latest.version,
    substitutionVersion: latest.tag.name,
    commitSha: latest.tag.sha,
  }
}

const getAllTags = async (
  owner: string,
  repo: string,
  regex?: string,
): Promise<TagInfo[] | null> => {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/tags?per_page=100`

  try {
    warnIfMissingToken()
    const tags = await fetchGitHubJson(apiUrl, GitHubTagsResponse, {
      token: githubToken,
      userAgent: GITHUB_USER_AGENT,
      cache: githubApiCache,
    })

    let filteredTags = tags
    if (regex) {
      const re = new RegExp(regex)
      filteredTags = tags.filter((t) => re.test(t.name))
    }

    filteredTags.sort((a, b) => compareVersions(b.name, a.name))
    return filteredTags.map((t) => ({ name: t.name, sha: t.commit.sha }))
  } catch (error) {
    console.error(`Error fetching tags: ${error}`)
    return null
  }
}

const buildTagArchiveUrl = (owner: string, repo: string, tag: string): string =>
  `https://github.com/${owner}/${repo}/archive/refs/tags/${tag}.zip`

const buildTagReleaseSource = (
  manifest: ModManifest,
  repo: { owner: string; repo: string },
  tag: TagInfo,
): ModManifest["source"] => {
  const urlTemplate = (manifest.autoupdate as Record<string, unknown> | undefined)?.url
  const url = typeof urlTemplate === "string"
    ? urlTemplate.replace(/\$version/g, tag.name)
    : buildTagArchiveUrl(repo.owner, repo.repo, tag.name)

  return {
    ...manifest.source,
    url,
    commit_sha: tag.sha,
  }
}

export const updateManifestHistoryFromTags = async (
  manifest: ModManifest,
): Promise<ModManifest | null> => {
  const autoupdate = manifest.autoupdate
  if (!autoupdate || autoupdate.type !== "tag") return null

  const updateUrl = autoupdate.update_url ?? manifest.homepage ?? extractRepoUrl(manifest)
  if (!updateUrl) return null

  const repoInfo = parseGitHubUrl(updateUrl)
  if (!repoInfo) return null

  const tags = await getAllTags(repoInfo.owner, repoInfo.repo, autoupdate.regex)
  if (!tags || tags.length === 0) return null

  const normalizedTags = tags
    .map((t) => ({
      tag: t,
      version: normalizeToSemVer(t.name),
    }))
    .filter((t): t is { tag: TagInfo; version: string } => typeof t.version === "string")
    .filter((t) => canParse(t.version))

  if (normalizedTags.length === 0) return null

  normalizedTags.sort((a, b) => {
    const va = tryParse(a.version)
    const vb = tryParse(b.version)
    if (va && vb) return compareSemVer(vb, va)
    return a.version.localeCompare(b.version)
  })

  const [latest, ...previous] = normalizedTags
  const updated: ModManifest = {
    ...manifest,
    version: latest.version,
    source: buildTagReleaseSource(manifest, repoInfo, latest.tag),
    last_updated: new Date().toISOString(),
    previous_releases: previous.map((tag) => ({
      version: tag.version,
      source: buildTagReleaseSource(manifest, repoInfo, tag.tag),
    })),
  }

  return updated
}

const getLatestCommitInfo = async (
  owner: string,
  repo: string,
  branch: string,
): Promise<LatestVersionInfo | null> => {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/commits/${branch}`

  try {
    warnIfMissingToken()
    const commit = await fetchGitHubJson(apiUrl, GitHubCommitResponse, {
      token: githubToken,
      userAgent: GITHUB_USER_AGENT,
      cache: githubApiCache,
    })

    // SemVer-compatible CalVer: MAJOR.MINOR.PATCH[-PRERELEASE]
    // Avoid leading zeros in numeric identifiers (SemVer rejects 01, 09, etc.)
    const date = new Date()
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const version = `${year}.${month}.${day}-${commit.sha.substring(0, 7)}`
    return { version, substitutionVersion: version, commitSha: commit.sha }
  } catch (error) {
    console.error(`Error fetching commit: ${error}`)
    return null
  }
}

/**
 * Normalize version string for comparison.
 * Strips leading 'v' or 'V' prefix.
 */
const normalizeVersion = (version: string): string => version.replace(/^[vV]/, "")

/**
 * Compare version strings.
 * Uses @std/semver for valid semver strings, falls back to lexicographic comparison.
 * Handles SemVer, CalVer, and tag formats.
 */
const compareVersions = (a: string, b: string): number => {
  const cleanA = normalizeVersion(a)
  const cleanB = normalizeVersion(b)

  // Try to use @std/semver for valid semver strings
  if (canParse(cleanA) && canParse(cleanB)) {
    const semverA = tryParse(cleanA)
    const semverB = tryParse(cleanB)
    if (semverA && semverB) {
      return compareSemVer(semverA, semverB)
    }
  }

  // Fallback: Split into numeric and non-numeric parts for comparison
  const partsA = cleanA.split(/[.\-_]/)
  const partsB = cleanB.split(/[.\-_]/)

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const partA = partsA[i] ?? ""
    const partB = partsB[i] ?? ""

    const numA = parseInt(partA, 10)
    const numB = parseInt(partB, 10)

    if (!isNaN(numA) && !isNaN(numB)) {
      if (numA !== numB) return numA - numB
    } else {
      const cmp = partA.localeCompare(partB)
      if (cmp !== 0) return cmp
    }
  }

  return 0
}

/**
 * Update a manifest with a new version.
 * Applies substitution rules from autoupdate config.
 */
export const applyVersionUpdate = (
  manifest: ModManifest,
  newVersion: string,
  substitutionVersion = newVersion,
): ModManifest => {
  const previousRelease = {
    version: manifest.version,
    source: { ...manifest.source },
    released_at: manifest.last_updated,
  }

  const updated = { ...manifest }
  updated.version = newVersion
  updated.last_updated = new Date().toISOString()

  // Track history (excluding current version) for per-mod details.
  const existing = manifest.previous_releases ?? []
  const byVersion = new Map(existing.map((r) => [r.version, r]))
  if (!byVersion.has(previousRelease.version)) {
    byVersion.set(previousRelease.version, previousRelease)
  }
  updated.previous_releases = Array.from(byVersion.values())

  if (manifest.autoupdate) {
    // Apply substitution keys
    for (const [key, value] of Object.entries(manifest.autoupdate)) {
      if (
        ["type", "update_url", "branch", "regex"].includes(key) ||
        typeof value !== "string"
      ) {
        continue
      }

      const substituted = value.replace(/\$version/g, substitutionVersion)

      // Handle nested keys like source.url
      if (key === "url" && updated.source) {
        updated.source = { ...updated.source, url: substituted }
      } else if (key === "icon_url") {
        updated.icon_url = substituted
      } else if (key === "commit_sha" && updated.source) {
        updated.source = { ...updated.source, commit_sha: substituted }
      }
    }
  }

  return updated
}

/**
 * Update a single manifest file if a new version is available.
 */
export const updateManifestFile = async (
  filePath: string,
): Promise<{ updated: boolean; newVersion?: string; error?: string }> => {
  try {
    const content = await Deno.readTextFile(filePath)
    const manifest = v.parse(ModManifestSchema, YAML.parse(content))

    if (!manifest.autoupdate) {
      return { updated: false }
    }

    console.log(`Checking ${filePath}...`)

    const latest = await getLatestVersionInfo(manifest)
    if (!latest) {
      return { updated: false, error: "Could not determine latest version" }
    }

    if (!canParse(latest.version)) {
      return { updated: false, error: `Latest version is not valid semver: ${latest.version}` }
    }

    if (latest.version === manifest.version) {
      console.log(`  Already up to date: ${manifest.version}`)
      return { updated: false }
    }

    console.log(`  New version: ${manifest.version} -> ${latest.version}`)

    const updated = applyVersionUpdate(manifest, latest.version, latest.substitutionVersion)

    if (latest.commitSha) {
      updated.source = { ...updated.source, commit_sha: latest.commitSha }
    }

    if (manifest.autoupdate?.type === "tag") {
      const updateUrl = manifest.autoupdate.update_url ?? manifest.homepage ??
        extractRepoUrl(manifest)
      const repoInfo = updateUrl ? parseGitHubUrl(updateUrl) : null
      if (repoInfo) {
        updated.source = buildTagReleaseSource(
          { ...manifest, source: updated.source },
          repoInfo,
          { name: latest.substitutionVersion, sha: latest.commitSha ?? "" },
        )
      }
    }

    // Verify URLs are valid before saving
    const urlsToCheck = [updated.source.url]
    if (updated.icon_url) urlsToCheck.push(updated.icon_url)

    for (const url of urlsToCheck) {
      const result = await checkUrl(url)
      if (!result.ok) {
        return { updated: false, error: `Invalid URL after update: ${url}` }
      }
    }

    // Write updated manifest
    await Deno.writeTextFile(filePath, stringify(updated, { quoteStyle: '"' }))

    return { updated: true, newVersion: latest.version }
  } catch (error) {
    return { updated: false, error: String(error) }
  }
}

/**
 * Update all manifests in a directory.
 * Respects .manifestignore file for skipping specific mods.
 */
export const updateAllManifests = async (
  manifestDir: string,
): Promise<{ total: number; updated: number; errors: number; skipped: number }> => {
  let total = 0
  let updated = 0
  let errors = 0
  let skipped = 0

  // Load ignore list
  const ignored = await loadManifestIgnore(manifestDir)
  if (ignored.size > 0) {
    console.log(`Loaded ${ignored.size} entries from .manifestignore\n`)
  }

  for await (
    const entry of walk(manifestDir, {
      exts: [".yaml", ".yml", ".json"],
      includeDirs: false,
      maxDepth: 1,
    })
  ) {
    // Skip example files
    if (entry.name.startsWith("_")) continue

    // Skip dotfiles like .manifestignore
    if (entry.name.startsWith(".")) continue

    total++

    // Check if this manifest should be ignored
    try {
      const content = await Deno.readTextFile(entry.path)
      const manifest = v.parse(ModManifestSchema, YAML.parse(content))

      if (shouldIgnoreManifest(manifest, ignored)) {
        console.log(`Skipping ${entry.name} (in .manifestignore)`)
        skipped++
        continue
      }
    } catch {
      // Continue with normal processing if we can't read the manifest
    }

    const result = await updateManifestFile(entry.path)

    if (result.updated) {
      updated++
      console.log(`  ✓ Updated to ${result.newVersion}`)
    } else if (result.error) {
      errors++
      console.error(`  ✗ Error: ${result.error}`)
    }
  }

  return { total, updated, errors, skipped }
}

// CLI entry point
if (import.meta.main) {
  await new Command()
    .name("autoupdate")
    .version("1.0.0")
    .description("Check for new versions and update mod manifests")
    .arguments("[target:string]")
    .option(
      "--history",
      "For tag-based manifests: populate previous_releases from all tags and pin current version/source to the latest tag",
    )
    .action(async (options, target = "manifests") => {
      try {
        const stat = await Deno.stat(target)

        if (stat.isDirectory) {
          if (options.history) {
            console.log(`Updating tag history in ${target}/`)
            let total = 0
            let updated = 0
            let errors = 0
            for await (
              const entry of walk(target, {
                exts: [".yaml", ".yml", ".json"],
                includeDirs: false,
                maxDepth: 1,
              })
            ) {
              if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue
              total++

              try {
                const content = await Deno.readTextFile(entry.path)
                const manifest = v.parse(ModManifestSchema, YAML.parse(content))
                const updatedManifest = await updateManifestHistoryFromTags(manifest)
                if (!updatedManifest) continue

                await Deno.writeTextFile(
                  entry.path,
                  stringify(updatedManifest, { quoteStyle: '"' }),
                )
                updated++
              } catch (error) {
                errors++
                console.error(`Error: ${entry.path}: ${error}`)
              }
            }

            console.log(`\nDone: ${updated}/${total} updated, ${errors} errors`)
          } else {
            console.log(`Updating manifests in ${target}/`)
            const result = await updateAllManifests(target)
            const skipMsg = result.skipped > 0 ? `, ${result.skipped} skipped` : ""
            console.log(
              `\nDone: ${result.updated}/${result.total} updated, ${result.errors} errors${skipMsg}`,
            )
          }
        } else {
          if (options.history) {
            const content = await Deno.readTextFile(target)
            const manifest = v.parse(ModManifestSchema, YAML.parse(content))
            const updatedManifest = await updateManifestHistoryFromTags(manifest)
            if (!updatedManifest) {
              console.log("No tag history update available")
              return
            }

            await Deno.writeTextFile(target, stringify(updatedManifest, { quoteStyle: '"' }))
            console.log(
              `Updated tag history: ${updatedManifest.version} (previous: ${
                updatedManifest.previous_releases?.length ?? 0
              })`,
            )
          } else {
            const result = await updateManifestFile(target)
            if (result.updated) {
              console.log(`Updated to ${result.newVersion}`)
            } else if (result.error) {
              console.error(`Error: ${result.error}`)
              Deno.exit(1)
            } else {
              console.log("No update needed")
            }
          }
        }
      } catch (error) {
        console.error(`Error: ${error}`)
        Deno.exit(1)
      }
    })
    .parse(Deno.args)
}
