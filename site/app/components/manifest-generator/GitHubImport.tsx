/**
 * GitHub import section for fetching mods from a GitHub repository.
 */

import { stripColorCodes } from "../../../../src/utils/github.ts"
import { store } from "./store.ts"
import { t } from "@lingui/core/macro"

interface GitHubImportProps {
  onFetch: () => void
  onSelectMod: (index: number) => void
}

export const GitHubImport = ({
  onFetch,
  onSelectMod,
}: GitHubImportProps) => (
  <section class="form-section import-section">
    <h3>{t`Import from GitHub`}</h3>
    <div class="form-group">
      <label htmlFor="github-repo-url">{t`GitHub Repository URL`}</label>
      <div class="input-with-button">
        <input
          id="github-repo-url"
          type="text"
          placeholder={t`https://github.com/owner/repo`}
          value={store.githubUrl}
          onInput={(e) => (store.githubUrl = e.currentTarget.value)}
        />
        <button
          type="button"
          class="button is-primary"
          onClick={onFetch}
          disabled={store.isLoading}
        >
          {store.isLoading ? t`Loading...` : t`Fetch`}
        </button>
      </div>
    </div>
    {store.rateLimit && (
      <p class="rate-limit-info">
        {t`GitHub API: ${store.rateLimit.remaining} requests remaining (resets ${store.rateLimit.reset.toLocaleTimeString()})`}
      </p>
    )}

    {store.foundMods.length > 0 && (
      <div class="found-mods">
        <p class="found-mods-label">
          {t`Select a mod (${store.foundMods.length} found):`}
        </p>
        <ul class="mod-list">
          {store.foundMods.map((mod, i) => (
            <li key={i}>
              <button
                type="button"
                class={`mod-list-item ${store.selectedModIndex === i ? "selected" : ""}`}
                onClick={() => onSelectMod(i)}
              >
                <strong class="mod-name">
                  {stripColorCodes(mod.modinfo.name)}
                </strong>
                <small class="mod-path">{mod.path || t`(root)`}</small>
              </button>
            </li>
          ))}
        </ul>
      </div>
    )}
  </section>
)
