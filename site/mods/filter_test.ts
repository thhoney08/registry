import { assertEquals } from "@std/assert"
import * as v from "valibot"
import { compareModCards, SortSchema } from "./filter.ts"

const card = (title: string, updatedAt = ""): HTMLElement =>
  ({ dataset: { title, updatedAt } }) as unknown as HTMLElement

Deno.test("SortSchema falls back to title sort for invalid query values", () => {
  assertEquals(v.parse(SortSchema, "updated-desc"), "updated-desc")
  assertEquals(v.parse(SortSchema, "nope"), "title-asc")
})

Deno.test("compareModCards sorts by newest update with title fallback", () => {
  const cards = [
    card("Beta", "2024-01-01T00:00:00Z"),
    card("Alpha", "2025-01-01T00:00:00Z"),
    card("Gamma"),
  ]

  assertEquals(
    cards.toSorted((a, b) => compareModCards(a, b, "updated-desc")).map((item) =>
      item.dataset.title
    ),
    ["Alpha", "Beta", "Gamma"],
  )
})

Deno.test("compareModCards sorts titles both directions", () => {
  const cards = [card("Beta"), card("Alpha")]
  assertEquals(
    cards.toSorted((a, b) => compareModCards(a, b, "title-asc")).map((item) => item.dataset.title),
    ["Alpha", "Beta"],
  )
  assertEquals(
    cards.toSorted((a, b) => compareModCards(a, b, "title-desc")).map((item) => item.dataset.title),
    ["Beta", "Alpha"],
  )
})
