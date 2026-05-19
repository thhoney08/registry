const DAY_IN_MS = 86_400_000

const parseTimestamp = (timestamp: string): Date | undefined => {
  const date = new Date(timestamp)
  return Number.isNaN(date.getTime()) ? undefined : date
}

const pad = (value: number): string => String(value).padStart(2, "0")

export const formatLastUpdatedRelativeDays = (
  { timestamp, locale = "en", now = new Date() }: {
    timestamp: string
    locale?: string
    now?: Date
  },
): string | undefined => {
  const date = parseTimestamp(timestamp)
  if (!date) return undefined

  const diffDays = (date.getTime() - now.getTime()) / DAY_IN_MS
  const roundedDays = diffDays < 0 ? Math.ceil(diffDays) : Math.floor(diffDays)

  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(roundedDays, "day")
}

export const formatLastUpdatedAbsolute = (timestamp: string): string | undefined => {
  const date = parseTimestamp(timestamp)
  if (!date) return undefined

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${
    pad(date.getUTCHours())
  }:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`
}
