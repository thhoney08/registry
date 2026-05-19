import {
  formatLastUpdatedAbsolute,
  formatLastUpdatedRelativeDays,
} from "../../src/utils/last_updated.ts"

type LastUpdatedTimeProps = {
  timestamp?: string
  locale?: string
  className?: string
}

export const LastUpdatedTime = ({
  timestamp,
  locale = "en",
  className,
}: LastUpdatedTimeProps) => {
  if (!timestamp) return null

  const relative = formatLastUpdatedRelativeDays({ timestamp, locale })
  const absolute = formatLastUpdatedAbsolute(timestamp)
  if (!relative || !absolute) return null

  return (
    <time class={className} datetime={timestamp} title={absolute}>
      {relative}
    </time>
  )
}
