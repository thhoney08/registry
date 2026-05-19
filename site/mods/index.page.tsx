import { partition, sortBy } from "@std/collections"
import { stripColorCodes } from "../../src/utils/color.ts"
import { ModCard } from "../_includes/ModCard.tsx"
import type { ModPageData } from "../_includes/types.ts"

export const layout = "base.tsx"
export const title = "All Mods"
export const id = "mods-index"
export const lang = ["en", "ko", "ja"]

type Locale = "en" | "ko" | "ja"

const text = {
  en: {
    heading: "All Mods",
    browse: "Browse all",
    modsSuffix: "mods in the registry.",
    searchPlaceholder: "Search mods...",
    searchLabel: "Search mods by name or description",
    categories: "Categories",
    lua: "Lua",
    usesLua: "Uses Lua",
    noMods: "No mods found.",
    submitFirst: "Submit the first one!",
  },
  ko: {
    heading: "전체 모드",
    browse: "저장소에 등록된",
    modsSuffix: "개 모드를 둘러보세요.",
    searchPlaceholder: "모드 검색...",
    searchLabel: "이름 또는 설명으로 모드 검색",
    categories: "카테고리",
    lua: "Lua",
    usesLua: "Lua 사용",
    noMods: "모드를 찾을 수 없습니다.",
    submitFirst: "첫 번째 모드를 등록해보세요!",
  },
  ja: {
    heading: "すべてのMod",
    browse: "レジストリ内の",
    modsSuffix: "件のModを表示します。",
    searchPlaceholder: "Modを検索...",
    searchLabel: "名前または説明でModを検索",
    categories: "カテゴリ",
    lua: "Lua",
    usesLua: "Lua使用",
    noMods: "Modが見つかりません。",
    submitFirst: "最初のModを投稿しましょう!",
  },
} as const

const withLangPrefix = (lang: Locale, path: string): string =>
  lang === "en" ? path : `/${lang}${path === "/" ? "" : path}`

/** Group mods by parent, with the parent mod and its submods */
interface ModGroup {
  main: ModPageData
  submods: ModPageData[]
}

/**
 * Group mods by their `parent` field.
 * Parent mods appear as the main card, submods are grouped under them.
 */
const groupModsByParent = (mods: ModPageData[]): ModGroup[] => {
  // Partition mods into parent mods and submods
  const [submods, parentMods] = partition(mods, (mod) => Boolean(mod.manifest.parent))

  // Group submods by their parent ID
  const submodsByParent = Map.groupBy(submods, (mod) => mod.manifest.parent!.toLowerCase())

  // Build groups: parent mods with their submods
  const groups = parentMods.map((mod) => ({
    main: mod,
    submods: submodsByParent.get(mod.manifest.id.toLowerCase()) ?? [],
  }))

  // Sort groups by main mod title
  return sortBy(groups, (g) => stripColorCodes(g.main.title))
}

/** Collect all unique categories from mods */
const collectCategories = (mods: ModPageData[]): string[] =>
  [...new Set(mods.flatMap((mod) => mod.manifest.categories ?? []))].sort()

export default ({ search, lang: currentLang = "en" }: Lume.Data) => {
  const lang = (currentLang as Locale) in text ? currentLang as Locale : "en"
  const t = text[lang]
  const submitUrl = withLangPrefix(lang, "/docs/submit/")

  const mods = (search.pages(`mod lang=${lang}`) as ModPageData[]).filter((mod) =>
    !mod.manifest.yanked
  )
  const groups = groupModsByParent(mods)
  const totalMods = mods.length
  const categories = collectCategories(mods)

  return (
    <>
      <h1>{t.heading}</h1>
      <p>
        {t.browse} <span id="visible-count">{totalMods}</span> / {totalMods} {t.modsSuffix}
      </p>

      <div class="mods-layout">
        {/* Filters Sidebar */}
        <aside class="filters-aside">
          <div class="search-box">
            <input
              type="text"
              id="mod-search"
              placeholder={t.searchPlaceholder}
              class="search-input"
              aria-label={t.searchLabel}
            />
          </div>

          <div class="category-filters">
            <h3>{t.lua}</h3>
            <label class="category-checkbox">
              <input type="checkbox" id="lua-filter" />
              {t.usesLua}
            </label>
          </div>

          {categories.length > 0 && (
            <div class="category-filters">
              <h3>{t.categories}</h3>
              {categories.map((category) => (
                <label class="category-checkbox" key={category}>
                  <input
                    type="checkbox"
                    class="category-filter"
                    value={category}
                  />
                  {category}
                </label>
              ))}
            </div>
          )}
        </aside>

        {/* Mod Grid */}
        <div class="mods-content">
          {groups.length === 0
            ? (
              <p>
                {t.noMods} <a href={submitUrl}>{t.submitFirst}</a>
              </p>
            )
            : (
              <div class="mod-grid">
                {groups.map((group) => (
                  <ModCard
                    key={group.main.manifest.id}
                    url={group.main.url}
                    title={group.main.title}
                    manifest={group.main.manifest}
                    lang={lang}
                    showCategories
                    submodCount={group.submods.length}
                    usesLua={Boolean(
                      group.main.manifest.uses_lua ||
                        group.submods.some((submod) => submod.manifest.uses_lua),
                    )}
                    updatedAt={group.main.sourceUpdatedAt}
                  />
                ))}
              </div>
            )}
        </div>
      </div>

      <script type="module" src="/mods/filter.js" />
    </>
  )
}
