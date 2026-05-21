import { batch, computed, effect, signal } from "@preact/signals"
import * as v from "valibot"

export const SortSchema = v.fallback(
  v.picklist(["title-asc", "title-desc", "updated-desc", "updated-asc"]),
  "title-asc",
)
export type SortKey = v.InferOutput<typeof SortSchema>

const searchTerm = signal("")
const selectedCategories = signal<string[]>([])
const onlyLua = signal(false)
const selectedSort = signal<SortKey>("title-asc")

const state = computed(() => ({
  searchTerm: searchTerm.value.trim().toLowerCase(),
  selectedCategories: selectedCategories.value,
  onlyLua: onlyLua.value,
  selectedSort: selectedSort.value,
}))

const unique = (values: string[]): string[] => [...new Set(values)].filter(Boolean).sort()

const readQuery = () => {
  const params = new URLSearchParams(location.search)
  batch(() => {
    searchTerm.value = params.get("search") ?? params.get("q") ?? ""
    selectedCategories.value = unique(params.getAll("category"))
    onlyLua.value = params.get("lua") === "true"
    selectedSort.value = v.parse(SortSchema, params.get("sort") ?? undefined)
  })
}

const writeQuery = (
  { searchTerm, selectedCategories, onlyLua, selectedSort }: typeof state.value,
) => {
  const params = new URLSearchParams(location.search)
  params.delete("q")
  params.delete("search")
  params.delete("category")
  params.delete("lua")
  params.delete("sort")
  if (searchTerm) params.set("search", searchTerm)
  for (const category of selectedCategories) params.append("category", category)
  if (onlyLua) params.set("lua", "true")
  if (selectedSort !== "title-asc") params.set("sort", selectedSort)

  const query = params.toString()
  const next = `${location.pathname}${query ? `?${query}` : ""}${location.hash}`
  if (next !== `${location.pathname}${location.search}${location.hash}`) {
    history.replaceState(null, "", next)
  }
}

const syncInputs = (
  searchInput: HTMLInputElement | null,
  categoryInputs: HTMLInputElement[],
  luaInput: HTMLInputElement | null,
  sortInput: HTMLSelectElement | null,
  { searchTerm, selectedCategories, onlyLua, selectedSort }: typeof state.value,
) => {
  if (searchInput && searchInput.value !== searchTerm) searchInput.value = searchTerm
  for (const input of categoryInputs) input.checked = selectedCategories.includes(input.value)
  if (luaInput) luaInput.checked = onlyLua
  if (sortInput && sortInput.value !== selectedSort) sortInput.value = selectedSort
}

const getTitle = (card: HTMLElement): string => card.dataset.title?.toLowerCase() ?? ""

const getUpdatedTime = (card: HTMLElement): number | undefined => {
  const time = Date.parse(card.dataset.updatedAt ?? "")
  return Number.isNaN(time) ? undefined : time
}

const compareTitle = (a: HTMLElement, b: HTMLElement): number =>
  getTitle(a).localeCompare(getTitle(b))

const compareUpdatedAt = (a: HTMLElement, b: HTMLElement, direction: 1 | -1): number => {
  const aTime = getUpdatedTime(a)
  const bTime = getUpdatedTime(b)
  if (aTime === undefined && bTime === undefined) return compareTitle(a, b)
  if (aTime === undefined) return 1
  if (bTime === undefined) return -1
  return direction * (aTime - bTime) || compareTitle(a, b)
}

export const compareModCards = (a: HTMLElement, b: HTMLElement, selectedSort: SortKey): number => {
  if (selectedSort === "title-desc") return -compareTitle(a, b)
  if (selectedSort === "updated-desc") return compareUpdatedAt(a, b, -1)
  if (selectedSort === "updated-asc") return compareUpdatedAt(a, b, 1)
  return compareTitle(a, b)
}

const sortCards = (cards: HTMLElement[], selectedSort: SortKey) => {
  const grid = cards[0]?.parentElement
  if (!grid) return
  grid.append(...cards.toSorted((a, b) => compareModCards(a, b, selectedSort)))
}

const filterCards = (
  cards: HTMLElement[],
  countEl: HTMLElement | null,
  { searchTerm, selectedCategories, onlyLua }: typeof state.value,
) => {
  let visibleCount = 0

  for (const card of cards) {
    const title = card.dataset.title?.toLowerCase() ?? ""
    const description = card.dataset.description?.toLowerCase() ?? ""
    const categories = (card.dataset.categories ?? "").split(",").filter(Boolean)
    const usesLua = card.dataset.usesLua === "true"
    const matchesSearch = !searchTerm || title.includes(searchTerm) ||
      description.includes(searchTerm)
    const matchesCategory = selectedCategories.length === 0 ||
      selectedCategories.some((category) => categories.includes(category))
    const visible = matchesSearch && matchesCategory && (!onlyLua || usesLua)
    card.style.display = visible ? "" : "none"
    if (visible) visibleCount++
  }

  if (countEl) countEl.textContent = String(visibleCount)
}

const init = () => {
  const searchInput = document.getElementById("mod-search") as HTMLInputElement | null
  const categoryInputs = Array.from(
    document.querySelectorAll<HTMLInputElement>(".category-filter"),
  )
  const luaInput = document.getElementById("lua-filter") as HTMLInputElement | null
  const sortInput = document.getElementById("mod-sort") as HTMLSelectElement | null
  const cards = Array.from(document.querySelectorAll<HTMLElement>(".mod-card"))
  const countEl = document.getElementById("visible-count")

  searchInput?.addEventListener("input", () => {
    searchTerm.value = searchInput.value
  })
  sortInput?.addEventListener("change", () => {
    selectedSort.value = v.parse(SortSchema, sortInput.value)
  })
  for (const input of categoryInputs) {
    input.addEventListener("change", () => {
      selectedCategories.value = unique(
        categoryInputs.filter((item) => item.checked).map((item) => item.value),
      )
    })
  }
  luaInput?.addEventListener("change", () => {
    onlyLua.value = luaInput.checked
  })
  addEventListener("popstate", readQuery)

  readQuery()
  effect(() => {
    const current = state.value
    syncInputs(searchInput, categoryInputs, luaInput, sortInput, current)
    sortCards(cards, current.selectedSort)
    filterCards(cards, countEl, current)
    writeQuery(current)
  })
}

if (typeof document !== "undefined") {
  document.readyState === "loading" ? addEventListener("DOMContentLoaded", init) : init()
}
