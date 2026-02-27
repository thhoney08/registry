import { ModManifest } from "../../mod.ts"
import { colorCodesToHtml, stripColorCodes } from "../../src/utils/color.ts"
import { resolveManifestIconCandidates } from "../../src/utils/icon.ts"
import { buildIconFallbackOnError, ModCard, PLACEHOLDER_ICON } from "./ModCard.tsx"

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
    categories: "Categories",
    download: "Download",
    description: "Description",
    installation: "Installation",
    installNoteLabel: "Note:",
    installNote: "Extract the",
    installNoteSuffix: "folder from the archive.",
    compatibility: "Compatibility",
    dependencies: "Dependencies:",
    conflicts: "Conflicts:",
    tags: "Tags",
    parentMod: "Parent Mod",
    submods: "Submods",
    none: "None",
    current: "current",
  },
  ko: {
    version: "버전",
    revision: "리비전",
    selectRevision: "리비전 선택",
    author: "작성자",
    license: "라이선스",
    categories: "카테고리",
    download: "다운로드",
    description: "설명",
    installation: "설치",
    installNoteLabel: "참고:",
    installNote: "압축 파일에서",
    installNoteSuffix: "폴더를 추출하세요.",
    compatibility: "호환성",
    dependencies: "의존성:",
    conflicts: "충돌 모드:",
    tags: "태그",
    parentMod: "부모 모드",
    submods: "서브모드",
    none: "없음",
    current: "현재",
  },
  ja: {
    version: "バージョン",
    revision: "リビジョン",
    selectRevision: "リビジョンを選択",
    author: "作者",
    license: "ライセンス",
    categories: "カテゴリ",
    download: "ダウンロード",
    description: "説明",
    installation: "導入方法",
    installNoteLabel: "注:",
    installNote: "アーカイブから",
    installNoteSuffix: "フォルダを展開してください。",
    compatibility: "互換性",
    dependencies: "依存関係:",
    conflicts: "競合:",
    tags: "タグ",
    parentMod: "親Mod",
    submods: "サブMod",
    none: "なし",
    current: "現在",
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
  { manifest, parentMod, submods = [], allManifests = [], lang = "en" }: PageData,
  _helpers: Lume.Helpers,
) => {
  const locale = (lang as Locale) in ui ? lang as Locale : "en"
  const text = ui[locale]
  const iconCandidates = resolveManifestIconCandidates(manifest)
  const iconUrl = iconCandidates.at(0) ?? PLACEHOLDER_ICON
  const iconFallbackOnError = buildIconFallbackOnError(iconCandidates.slice(1))
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

  return (
    <article class="mod-page">
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
            <code>{manifest.source.extract_path}</code> {text.installNoteSuffix}
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
                />
              ))}
            </div>
          </>
        )}
      </section>
      {hasRevisions && <script dangerouslySetInnerHTML={{ __html: revisionScript }} />}
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
