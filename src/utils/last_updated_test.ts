import { assertEquals } from "@std/assert"
import { formatLastUpdatedAbsolute, formatLastUpdatedRelativeDays } from "./last_updated.ts"

Deno.test("formatLastUpdatedRelativeDays formats past timestamps in days", () => {
  assertEquals(
    formatLastUpdatedRelativeDays({
      timestamp: "2026-05-15T12:00:00.000Z",
      now: new Date("2026-05-19T12:00:00.000Z"),
    }),
    "4 days ago",
  )
})

Deno.test("formatLastUpdatedRelativeDays uses today for same-day timestamps", () => {
  assertEquals(
    formatLastUpdatedRelativeDays({
      timestamp: "2026-05-19T18:00:00.000Z",
      now: new Date("2026-05-19T12:00:00.000Z"),
    }),
    "today",
  )
})

Deno.test("formatLastUpdatedAbsolute formats UTC timestamps for hover titles", () => {
  assertEquals(formatLastUpdatedAbsolute("2026-05-15T01:02:03.000Z"), "2026-05-15 01:02:03")
})

Deno.test("last updated formatters return undefined for invalid timestamps", () => {
  assertEquals(formatLastUpdatedRelativeDays({ timestamp: "invalid" }), undefined)
  assertEquals(formatLastUpdatedAbsolute("invalid"), undefined)
})
