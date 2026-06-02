import { assertEquals } from "@std/assert"
import * as v from "valibot"
import { compareModCards, filterCards, SortSchema } from "./filter.ts"

const card = (title: string, updatedAt = "", modCount?: string): HTMLElement =>
  ({ dataset: { title, updatedAt, modCount }, style: {} }) as unknown as HTMLElement

Deno.test("SortSchema falls back to newest update sort for invalid query values", () => {
  assertEquals(v.parse(SortSchema, "title-asc"), "title-asc")
  assertEquals(v.parse(SortSchema, "nope"), "updated-desc")
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

Deno.test("filterCards counts submods for visible mod groups", () => {
  const countEl = { textContent: "" } as HTMLElement
  filterCards(
    [card("Parent", "", "3"), card("Standalone")],
    countEl,
    { searchTerm: "", selectedCategories: [], onlyLua: false, selectedSort: "updated-desc" },
  )

  assertEquals(countEl.textContent, "4")
})
