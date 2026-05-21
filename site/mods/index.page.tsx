import { partition } from "@std/collections"
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
    sort: "Sort",
    sortLabel: "Sort mods",
    sortTitleAsc: "Title (A-Z)",
    sortTitleDesc: "Title (Z-A)",
    sortUpdatedDesc: "Last updated (newest)",
    sortUpdatedAsc: "Last updated (oldest)",
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
    sort: "정렬",
    sortLabel: "모드 정렬",
    sortTitleAsc: "제목 (A-Z)",
    sortTitleDesc: "제목 (Z-A)",
    sortUpdatedDesc: "마지막 업데이트 (최신순)",
    sortUpdatedAsc: "마지막 업데이트 (오래된순)",
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
    sort: "並べ替え",
    sortLabel: "Modを並べ替え",
    sortTitleAsc: "タイトル (A-Z)",
    sortTitleDesc: "タイトル (Z-A)",
    sortUpdatedDesc: "最終更新 (新しい順)",
    sortUpdatedAsc: "最終更新 (古い順)",
    categories: "カテゴリ",
    lua: "Lua",
    usesLua: "Lua使用",
    noMods: "Modが見つかりません。",
    submitFirst: "最初のModを投稿しましょう!",
  },
} as const

const withLangPrefix = (lang: Locale, path: string): string =>
  lang === "en" ? path : `/${lang}${path === "/" ? "" : path}`

const getTimestamp = (timestamp?: string): number => {
  const time = Date.parse(timestamp ?? "")
  return Number.isNaN(time) ? 0 : time
}

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

  return groups.toSorted((a, b) =>
    getTimestamp(getGroupUpdatedAt(b)) - getTimestamp(getGroupUpdatedAt(a)) ||
    stripColorCodes(a.main.title).localeCompare(stripColorCodes(b.main.title))
  )
}

/** Collect all unique categories from mods */
const collectCategories = (mods: ModPageData[]): string[] =>
  [...new Set(mods.flatMap((mod) => mod.manifest.categories ?? []))].sort()

const getGroupUpdatedAt = ({ main, submods }: ModGroup): string | undefined =>
  [main, ...submods]
    .map((mod) => mod.sourceUpdatedAt)
    .filter((timestamp): timestamp is string => Boolean(timestamp))
    .toSorted((a, b) => Date.parse(b) - Date.parse(a))[0]

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
          <div class="filter-control search-box">
            <label for="mod-search">{t.searchLabel}</label>
            <input
              type="text"
              id="mod-search"
              placeholder={t.searchPlaceholder}
              class="search-input"
            />
          </div>

          <div class="filter-control">
            <label for="mod-sort">{t.sort}</label>
            <select id="mod-sort" class="sort-select" aria-label={t.sortLabel}>
              <option value="updated-desc">{t.sortUpdatedDesc}</option>
              <option value="updated-asc">{t.sortUpdatedAsc}</option>
              <option value="title-asc">{t.sortTitleAsc}</option>
              <option value="title-desc">{t.sortTitleDesc}</option>
            </select>
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
                    updatedAt={getGroupUpdatedAt(group)}
                  />
                ))}
              </div>
            )}
        </div>
      </div>

      <script type="module" src="/mods/filter.js?v=20260521a" />
    </>
  )
}
