/**
 * Shared ModCard component for displaying mod cards across the site.
 */

import type { ModManifest } from "../../mod.ts"
import { colorCodesToHtml, stripColorCodes } from "../../src/utils/color.ts"
import { resolveManifestIconCandidates } from "../../src/utils/icon.ts"

type Locale = "en" | "ko" | "ja"

const ui = {
  en: { submods: "submods" },
  ko: { submods: "서브모드" },
  ja: { submods: "サブMod" },
} as const

export const PLACEHOLDER_ICON = "/assets/mod-placeholder.svg"

export const buildIconFallbackOnError = (fallbackUrls: string[]): string => {
  const urls = [...fallbackUrls, PLACEHOLDER_ICON]
  return `const urls=${
    JSON.stringify(urls)
  };const i=Number(this.dataset.iconFallbackIndex||"0");if(i>=urls.length){this.onerror=null;return;}this.dataset.iconFallbackIndex=String(i+1);this.src=urls[i];`
}

export interface ModCardProps {
  url: string
  title: string
  manifest: ModManifest
  /** Whether to show categories (used on home page) */
  showCategories?: boolean
  /** Number of submods (patches, addons) for this mod group */
  submodCount?: number
  /** Key prop for React rendering */
  key?: string
}

/**
 * Reusable mod card component for displaying mod information in a grid.
 */
export const ModCard = (
  { url, title, manifest, showCategories = false, submodCount = 0, lang = "en" }:
    & ModCardProps
    & { lang?: string },
) => {
  const locale = (lang as Locale) in ui ? lang as Locale : "en"
  const text = ui[locale]
  const plainTitle = stripColorCodes(title)
  const plainDesc = stripColorCodes(manifest.short_description)
  const iconCandidates = resolveManifestIconCandidates(manifest)
  const iconUrl = iconCandidates.at(0) ?? PLACEHOLDER_ICON
  const iconFallbackOnError = buildIconFallbackOnError(iconCandidates.slice(1))
  const categories = manifest.categories?.join(",") ?? ""
  const displayVersion = manifest.version.startsWith("v") || manifest.version.startsWith("V")
    ? manifest.version
    : `v${manifest.version}`

  return (
    <article
      class={`mod-card ${submodCount > 0 ? "mod-card-stacked" : ""}`}
      data-title={plainTitle}
      data-description={plainDesc}
      data-categories={categories}
    >
      {submodCount > 0 && (
        <>
          <div class="mod-card-stack mod-card-stack-3" />
          <div class="mod-card-stack mod-card-stack-2" />
        </>
      )}
      <a href={url} class="mod-card-link">
        <img
          src={iconUrl}
          alt={`${plainTitle} icon`}
          class="mod-card-icon"
          width="80"
          height="80"
          loading="lazy"
          onerror={iconFallbackOnError}
          data-icon-fallback-index="0"
        />
        <div class="mod-card-content">
          <h3 dangerouslySetInnerHTML={{ __html: colorCodesToHtml(title) }} />
          <p class="mod-meta">
            {displayVersion} · {manifest.author}
            {submodCount > 0 && (
              <span class="badge submod-badge">+{submodCount} {text.submods}</span>
            )}
          </p>
          {showCategories && manifest.categories && manifest.categories.length > 0 && (
            <div class="mod-categories">
              {manifest.categories.map((category) => (
                <span class="badge" key={category}>{category}</span>
              ))}
            </div>
          )}
          <p
            class="mod-desc"
            dangerouslySetInnerHTML={{
              __html: colorCodesToHtml(manifest.short_description),
            }}
          />
        </div>
      </a>
    </article>
  )
}
