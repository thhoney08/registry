import { ModManifest } from "../../mod.ts"
import { colorCodesToHtml, stripColorCodes } from "../../src/utils/color.ts"
import { buildIconFallbackOnError, ModCard } from "./ModCard.tsx"
import { resolveManifestModInfoUrl } from "../../src/utils/modinfo_url.ts"
import { resolveCategoryIconUrl } from "./categoryIcon.ts"
import { LastUpdatedTime } from "./LastUpdatedTime.tsx"

export const layout = "base.tsx"

const HOME_ICON = "/assets/home-icon.svg"
const GITHUB_ICON = "/assets/github-icon.svg"

type Locale = "en" | "ko" | "ja"

const ui = {
  en: {
    version: "Version",
    revision: "Revision",
    selectRevision: "Select revision",
    author: "Author",
    license: "License",
    updated: "Updated",
    categories: "Categories",
    lua: "Lua",
    yes: "Yes",
    no: "No",
    download: "Download",
    description: "Description",
    installation: "Installation",
    installNoteLabel: "Note:",
    installNote: "Extract the",
    installNoteSuffix: "folder to",
    compatibility: "Compatibility",
    dependencies: "Dependencies:",
    conflicts: "Conflicts:",
    tags: "Tags",
    parentMod: "Parent Mod",
    submods: "Submods",
    none: "None",
    current: "current",
    yanked: "Yanked",
    rawModinfo: "Raw modinfo.json",
    loading: "Loading...",
    loadFailed: "Failed to load modinfo.json.",
  },
  ko: {
    version: "버전",
    revision: "리비전",
    selectRevision: "리비전 선택",
    author: "작성자",
    license: "라이선스",
    updated: "업데이트",
    categories: "카테고리",
    lua: "Lua",
    yes: "예",
    no: "아니요",
    download: "다운로드",
    description: "설명",
    installation: "설치",
    installNoteLabel: "참고:",
    installNote: "압축 파일에서",
    installNoteSuffix: "폴더를 다음 위치에 추출하세요:",
    compatibility: "호환성",
    dependencies: "의존성:",
    conflicts: "충돌 모드:",
    tags: "태그",
    parentMod: "부모 모드",
    submods: "서브모드",
    none: "없음",
    current: "현재",
    yanked: "비활성",
    rawModinfo: "원본 modinfo.json",
    loading: "불러오는 중...",
    loadFailed: "modinfo.json을 불러오지 못했습니다.",
  },
  ja: {
    version: "バージョン",
    revision: "リビジョン",
    selectRevision: "リビジョンを選択",
    author: "作者",
    license: "ライセンス",
    updated: "更新日",
    categories: "カテゴリ",
    lua: "Lua",
    yes: "はい",
    no: "いいえ",
    download: "ダウンロード",
    description: "説明",
    installation: "導入方法",
    installNoteLabel: "注:",
    installNote: "アーカイブから",
    installNoteSuffix: "フォルダを次の場所に展開してください:",
    compatibility: "互換性",
    dependencies: "依存関係:",
    conflicts: "競合:",
    tags: "タグ",
    parentMod: "親Mod",
    submods: "サブMod",
    none: "なし",
    current: "現在",
    yanked: "非公開",
    rawModinfo: "元のmodinfo.json",
    loading: "読み込み中...",
    loadFailed: "modinfo.jsonを読み込めませんでした。",
  },
} as const

const withLangPrefix = (lang: Locale, path: string): string =>
  lang === "en" ? path : `/${lang}${path === "/" ? "" : path}`

interface PageData {
  title: string
  manifest: ModManifest
  lang?: string
  parentMod?: ModManifest
  submods?: ModManifest[]
  allManifests?: ModManifest[]
  sourceUpdatedAt?: string
  sourceUpdatedAtById?: Record<string, string>
  children?: Lume.Data["children"]
}

type UiRelease = {
  label: string
  version: string
  url: string
}

/** Check if a mod ID exists in the registry */
const findModInRegistry = (modId: string, allManifests?: ModManifest[]): ModManifest | undefined =>
  allManifests?.find((m) =>
    m.id.toLowerCase() === modId.toLowerCase() ||
    m.display_name.toLowerCase() === modId.toLowerCase()
  )

const ModTitle = ({ title }: { title: string }) => (
  <h1 dangerouslySetInnerHTML={{ __html: colorCodesToHtml(title) }} />
)

const stripVersionPrefix = (version: string): string =>
  version.startsWith("v") || version.startsWith("V") ? version.slice(1) : version

export default (
  {
    manifest,
    parentMod,
    submods = [],
    allManifests = [],
    sourceUpdatedAt,
    sourceUpdatedAtById = {},
    lang = "en",
  }: PageData,
  _helpers: Lume.Helpers,
) => {
  const locale = (lang as Locale) in ui ? lang as Locale : "en"
  const text = ui[locale]
  const categoryIconUrl = resolveCategoryIconUrl(manifest)
  const iconUrl = manifest.icon_url ?? categoryIconUrl
  const iconFallbackOnError = manifest.icon_url
    ? buildIconFallbackOnError([categoryIconUrl])
    : buildIconFallbackOnError([])
  const modinfoUrl = resolveManifestModInfoUrl(manifest)
  const releases: UiRelease[] = [
    {
      label: `${manifest.version} (${text.current})`,
      version: manifest.version,
      url: manifest.source.url,
    },
  ]

  for (const prev of manifest.previous_releases ?? []) {
    releases.push({ label: prev.version, version: prev.version, url: prev.source.url })
  }

  const hasRevisions = releases.length > 1
  const installTarget = manifest.package_type === "soundpack" ? "data/sound" : "data/mods"

  const revisionScript = `
     (() => {
       const select = document.getElementById('revision-select')
       const downloadLink = document.getElementById('download-link')
       const installLink = document.getElementById('install-link')
       const versionText = document.getElementById('mod-version')
       const installVersionText = document.getElementById('install-version')

       if (!select || !downloadLink || !versionText) return

       const stripVer = (ver) => (ver.startsWith('v') || ver.startsWith('V')) ? ver.slice(1) : ver
       const apply = () => {
         const option = select.selectedOptions && select.selectedOptions[0]
         if (!option) return
         const url = option.getAttribute('data-url')
         const version = option.getAttribute('data-version')
         if (url) {
           downloadLink.setAttribute('href', url)
           if (installLink) installLink.setAttribute('href', url)
         }
         if (version) {
           const stripped = stripVer(version)
           versionText.textContent = stripped
           if (installVersionText) installVersionText.textContent = stripped
         }
       }

       select.addEventListener('change', apply)
       apply()
     })()
   `

  const modinfoScript = `
    (() => {
      const details = document.getElementById('raw-modinfo')
      const code = document.getElementById('raw-modinfo-content')
      if (!details || !code) return

      const escapeHtml = (value) => value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

      const highlightJson = (raw) => escapeHtml(JSON.stringify(JSON.parse(raw), null, 2))
        .replace(/(\"(?:\\\\.|[^\"\\\\])*\")(?=\\s*:)/g, '<span class="json-key">$1</span>')
        .replace(/:\\s*(\"(?:\\\\.|[^\"\\\\])*\")/g, ': <span class="json-string">$1</span>')
        .replace(/:\\s*(-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)/g, ': <span class="json-number">$1</span>')
        .replace(/:\\s*(true|false)/g, ': <span class="json-boolean">$1</span>')
        .replace(/:\\s*(null)/g, ': <span class="json-null">$1</span>')

      details.addEventListener('toggle', async () => {
        if (!details.open || code.dataset.loaded === 'true') return
        const url = code.dataset.url
        if (!url) return
        try {
          const response = await fetch(url)
          if (!response.ok) throw new Error(String(response.status))
          code.innerHTML = highlightJson(await response.text())
        } catch {
          code.textContent = ${JSON.stringify(text.loadFailed)}
        }
        code.dataset.loaded = 'true'
      })
    })()
  `

  return (
    <article class={`mod-page ${manifest.yanked ? "mod-page-yanked" : ""}`}>
      <header>
        <img
          src={iconUrl}
          alt={`${stripColorCodes(manifest.display_name)} icon`}
          class="mod-icon"
          width="160"
          height="160"
          onerror={iconFallbackOnError}
          data-icon-fallback-index="0"
        />
        {manifest.homepage
          ? (
            <a
              href={manifest.homepage}
              target="_blank"
              rel="noopener noreferrer"
              title="Visit Homepage"
              class="mod-homepage-link"
            >
              <ModTitle title={manifest.display_name} />
              <img
                src={/http(s)?:\/\/(www\.)?github\.com\/.*/.test(manifest.homepage)
                  ? GITHUB_ICON
                  : HOME_ICON}
                alt="(homepage)"
                width="32"
                height="32"
                aria-hidden="true"
              />
            </a>
          )
          : <ModTitle title={manifest.display_name} />}
      </header>

      {manifest.yanked && (
        <p class="yanked-notice">
          <strong>{text.yanked}</strong>: {manifest.yanked.reason}
        </p>
      )}

      <aside>
        <dl>
          <dt>{text.version}</dt>
          <dd id="mod-version">{stripVersionPrefix(manifest.version)}</dd>

          {hasRevisions && (
            <>
              <dt>{text.revision}</dt>
              <dd>
                <select id="revision-select" name="revision" aria-label={text.selectRevision}>
                  {releases.map((release) => (
                    <option
                      key={release.version}
                      value={release.version}
                      data-version={release.version}
                      data-url={release.url}
                    >
                      {release.label}
                    </option>
                  ))}
                </select>
              </dd>
            </>
          )}

          <dt>{text.author}</dt>
          <dd>{manifest.author.join(", ")}</dd>

          <dt>{text.license}</dt>
          <dd>{manifest.license}</dd>

          {sourceUpdatedAt && (
            <>
              <dt>{text.updated}</dt>
              <dd>
                <LastUpdatedTime timestamp={sourceUpdatedAt} locale={locale} />
              </dd>
            </>
          )}

          <dt>{text.lua}</dt>
          <dd>
            {manifest.uses_lua ? text.yes : text.no}
            {manifest.lua_api_version !== undefined && ` (${manifest.lua_api_version})`}
          </dd>

          {manifest.categories && manifest.categories.length > 0 && (
            <>
              <dt>{text.categories}</dt>
              <dd class="mod-categories">
                {manifest.categories.map((category) => (
                  <span class="badge" key={category}>{category}</span>
                ))}
              </dd>
            </>
          )}
        </dl>

        <button type="button">
          <a href={manifest.source.url} id="download-link">
            {text.download}
          </a>
        </button>
      </aside>

      <section class="mod-content">
        <h2>{text.description}</h2>
        <div
          dangerouslySetInnerHTML={{
            __html: colorCodesToHtml(manifest.description || manifest.short_description),
          }}
        />

        <h2>{text.installation}</h2>
        <p>
          Download:{" "}
          <a href={manifest.source.url} id="install-link">
            <span
              dangerouslySetInnerHTML={{ __html: colorCodesToHtml(manifest.display_name) }}
            />{" "}
            <span id="install-version">{stripVersionPrefix(manifest.version)}</span>
          </a>
        </p>
        {manifest.source.extract_path && (
          <p>
            <strong>{text.installNoteLabel}</strong> {text.installNote}{" "}
            <code>{manifest.source.extract_path}</code> {text.installNoteSuffix}{" "}
            <code>{installTarget}</code>.
          </p>
        )}

        <h2>{text.compatibility}</h2>
        <ul>
          <li>
            <strong>{text.dependencies}</strong>{" "}
            <DepList deps={manifest.dependencies} allManifests={allManifests} lang={locale} />
          </li>
          <li>
            <strong>{text.conflicts}</strong>{" "}
            <DepList deps={manifest.conflicts} allManifests={allManifests} lang={locale} />
          </li>
        </ul>

        {manifest.tags && manifest.tags.length > 0 && (
          <>
            <h2>{text.tags}</h2>
            <div class="mod-categories">
              {manifest.tags.map((tag) => <span class="badge" key={tag}>{tag}</span>)}
            </div>
          </>
        )}

        {modinfoUrl && (
          <details id="raw-modinfo" class="modinfo-raw">
            <summary>{text.rawModinfo}</summary>
            <pre><code id="raw-modinfo-content" data-url={modinfoUrl}>{text.loading}</code></pre>
          </details>
        )}

        {parentMod && (
          <>
            <h2>{text.parentMod}</h2>
            <div class="mod-grid related-mods">
              <ModCard
                key={parentMod.id}
                url={withLangPrefix(locale, `/mods/${parentMod.id}/`)}
                title={parentMod.display_name}
                manifest={parentMod}
                lang={locale}
                updatedAt={sourceUpdatedAtById[parentMod.id]}
              />
            </div>
          </>
        )}

        {submods.length > 0 && (
          <>
            <h2>{text.submods}</h2>
            <div class="mod-grid related-mods">
              {submods.map((submod) => (
                <ModCard
                  key={submod.id}
                  url={withLangPrefix(locale, `/mods/${submod.id}/`)}
                  title={submod.display_name}
                  manifest={submod}
                  lang={locale}
                  updatedAt={sourceUpdatedAtById[submod.id]}
                />
              ))}
            </div>
          </>
        )}
      </section>
      {hasRevisions && <script dangerouslySetInnerHTML={{ __html: revisionScript }} />}
      {modinfoUrl && <script dangerouslySetInnerHTML={{ __html: modinfoScript }} />}
    </article>
  )
}

/** Render dependencies/conflicts as clickable links when they exist in registry */
const DepList = (
  {
    deps,
    allManifests,
    lang,
  }: { deps?: Record<string, string>; allManifests: ModManifest[]; lang: Locale },
) => {
  const entries = Object.entries(deps ?? {})
  if (entries.length === 0) return <span>{ui[lang].none}</span>

  return (
    <>
      {entries.map(([modId, version], i) => {
        const foundMod = findModInRegistry(modId, allManifests)
        return (
          <span key={modId}>
            {foundMod
              ? (
                <a href={withLangPrefix(lang, `/mods/${foundMod.id}/`)} class="dep-link">
                  {modId}
                </a>
              )
              : <span>{modId}</span>} <span class="version-constraint">{version}</span>
            {i < entries.length - 1 && ", "}
          </span>
        )
      })}
    </>
  )
}
