import * as v from "valibot"

const DEFAULT_USER_AGENT = "cata-bn-registry/1.0"
const DEFAULT_MAX_RETRIES = 4
const DEFAULT_MAX_WAIT_MS = 30_000

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const tryGetEnv = (key: string): string | undefined => {
  try {
    const value = Deno.env.get(key)
    return value?.trim() ? value.trim() : undefined
  } catch {
    return undefined
  }
}

const canRunCommands = async (): Promise<boolean> => {
  try {
    const status = await Deno.permissions.query({ name: "run" })
    return status.state === "granted"
  } catch {
    return false
  }
}

const commandExists = async (cmd: string): Promise<boolean> => {
  try {
    const proc = new Deno.Command(cmd, { args: ["--version"], stdout: "null", stderr: "null" })
    const { success } = await proc.output()
    return success
  } catch {
    return false
  }
}

const tryGetGhAuthToken = async (): Promise<string | undefined> => {
  if (!(await canRunCommands())) return undefined
  if (!(await commandExists("gh"))) return undefined

  try {
    const proc = new Deno.Command("gh", {
      args: ["auth", "token"],
      stdout: "piped",
      stderr: "null",
    })
    const { success, stdout } = await proc.output()
    if (!success) return undefined

    const token = new TextDecoder().decode(stdout).trim()
    return token ? token : undefined
  } catch {
    return undefined
  }
}

export const getGitHubToken = async (): Promise<string | undefined> => {
  const envToken = tryGetEnv("GITHUB_TOKEN") ?? tryGetEnv("GH_TOKEN")
  if (envToken) return envToken

  return await tryGetGhAuthToken()
}

type FetchGitHubJsonOptions = {
  token?: string
  userAgent?: string
  maxRetries?: number
  maxWaitMs?: number
  cache?: Map<string, unknown>
}

const computeRetryDelayMs = (
  response: Response,
  attempt: number,
): number | null => {
  const retryAfter = response.headers.get("retry-after")
  if (retryAfter) {
    const seconds = Number(retryAfter)
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.min(seconds * 1000, DEFAULT_MAX_WAIT_MS)
    }
  }

  const remaining = response.headers.get("x-ratelimit-remaining")
  const reset = response.headers.get("x-ratelimit-reset")
  if (remaining === "0" && reset) {
    const resetSeconds = Number(reset)
    if (Number.isFinite(resetSeconds)) {
      const waitMs = resetSeconds * 1000 - Date.now()
      if (waitMs > 0) return Math.min(waitMs, DEFAULT_MAX_WAIT_MS)
    }
  }

  const backoff = 250 * (2 ** attempt)
  return Math.min(backoff, DEFAULT_MAX_WAIT_MS)
}

export const fetchGitHubJson = async <T>(
  url: string,
  schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>,
  options: FetchGitHubJsonOptions = {},
): Promise<T> => {
  const cache = options.cache
  if (cache?.has(url)) {
    return v.parse(schema, cache.get(url))
  }

  const token = options.token
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES
  const maxWaitMs = options.maxWaitMs ?? DEFAULT_MAX_WAIT_MS

  const headers = new Headers({
    Accept: "application/vnd.github+json",
    "User-Agent": options.userAgent ?? DEFAULT_USER_AGENT,
    "X-GitHub-Api-Version": "2022-11-28",
  })

  if (token) headers.set("Authorization", `Bearer ${token}`)

  let lastError: unknown = undefined

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, { headers })

      if (response.ok) {
        const raw = await response.json()
        cache?.set(url, raw)
        return v.parse(schema, raw)
      }

      const status = response.status
      const bodyText = await response.text().catch(() => "")

      if (status === 429 || status === 403) {
        const delayMs = computeRetryDelayMs(response, attempt)
        if (delayMs !== null && delayMs <= maxWaitMs && attempt < maxRetries) {
          await sleep(delayMs)
          continue
        }
      }

      throw new Error(
        `GitHub API request failed: ${status} ${response.statusText}${
          bodyText ? ` (${bodyText.slice(0, 200)})` : ""
        }`,
      )
    } catch (error) {
      lastError = error
      if (attempt >= maxRetries) break
      await sleep(Math.min(250 * (2 ** attempt), maxWaitMs))
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}
