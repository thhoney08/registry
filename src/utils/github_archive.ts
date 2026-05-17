export interface GitHubArchiveInfo {
  owner: string
  repo: string
  ref: string
}

export const normalizeExtractPath = (extractPath?: string): string => {
  if (!extractPath || extractPath === ".") return ""
  return extractPath.replace(/^\/+|\/+$/g, "")
}

export const normalizeRawContentPath = (extractPath: string, repo: string): string => {
  if (!extractPath) return ""

  const [firstSegment, ...rest] = extractPath.split("/")
  if (firstSegment.toLowerCase().startsWith(`${repo.toLowerCase()}-`) && rest.length > 0) {
    return rest.join("/")
  }

  return extractPath
}

export const parseGitHubArchiveUrl = (archiveUrl: string): GitHubArchiveInfo | null => {
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

const encodePath = (path: string): string => path.split("/").map(encodeURIComponent).join("/")

export const buildGitHubRawUrl = (
  { owner, repo, ref }: GitHubArchiveInfo,
  path: string,
): string =>
  `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(ref)}/${
    encodePath(path)
  }`
