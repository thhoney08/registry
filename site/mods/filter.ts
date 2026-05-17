import { batch, computed, effect, signal } from "@preact/signals"

const searchTerm = signal("")
const selectedCategories = signal<string[]>([])
const onlyLua = signal(false)

const state = computed(() => ({
  searchTerm: searchTerm.value.trim().toLowerCase(),
  selectedCategories: selectedCategories.value,
  onlyLua: onlyLua.value,
}))

const unique = (values: string[]): string[] => [...new Set(values)].filter(Boolean).sort()

const readQuery = () => {
  const params = new URLSearchParams(location.search)
  batch(() => {
    searchTerm.value = params.get("search") ?? params.get("q") ?? ""
    selectedCategories.value = unique(params.getAll("category"))
    onlyLua.value = params.get("lua") === "true"
  })
}

const writeQuery = ({ searchTerm, selectedCategories, onlyLua }: typeof state.value) => {
  const params = new URLSearchParams(location.search)
  params.delete("q")
  params.delete("search")
  params.delete("category")
  params.delete("lua")
  if (searchTerm) params.set("search", searchTerm)
  for (const category of selectedCategories) params.append("category", category)
  if (onlyLua) params.set("lua", "true")

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
  { searchTerm, selectedCategories, onlyLua }: typeof state.value,
) => {
  if (searchInput && searchInput.value !== searchTerm) searchInput.value = searchTerm
  for (const input of categoryInputs) input.checked = selectedCategories.includes(input.value)
  if (luaInput) luaInput.checked = onlyLua
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
  const cards = Array.from(document.querySelectorAll<HTMLElement>(".mod-card"))
  const countEl = document.getElementById("visible-count")

  searchInput?.addEventListener("input", () => {
    searchTerm.value = searchInput.value
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
    syncInputs(searchInput, categoryInputs, luaInput, current)
    filterCards(cards, countEl, current)
    writeQuery(current)
  })
}

document.readyState === "loading" ? addEventListener("DOMContentLoaded", init) : init()
