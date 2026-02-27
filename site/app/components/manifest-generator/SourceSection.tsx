/// <reference lib="dom" />
/**
 * Source form section for download URL and related settings.
 */

import { store } from "./store.ts"
import { t } from "@lingui/core/macro"

export const SourceSection = () => (
  <section class="form-section">
    <h3>{t`Source`}</h3>
    <div class="form-group">
      <label htmlFor="source-type">{t`Source Type`}</label>
      <select
        id="source-type"
        value={store.sourceType}
        onChange={(e) => (store.sourceType = e.currentTarget.value)}
      >
        <option value="github_archive">{t`GitHub Archive`}</option>
        <option value="gitlab_archive">{t`GitLab Archive`}</option>
        <option value="direct_url">{t`Direct URL`}</option>
      </select>
    </div>
    <div class="form-group">
      <label htmlFor="source-url">{t`Source URL *`}</label>
      <input
        id="source-url"
        type="url"
        placeholder={t`https://github.com/owner/repo/archive/refs/heads/main.zip`}
        value={store.sourceUrl}
        onInput={(e) => (store.sourceUrl = e.currentTarget.value)}
      />
    </div>
    <div class="form-group">
      <label htmlFor="source-commit-sha">{t`Commit SHA`}</label>
      <input
        id="source-commit-sha"
        type="text"
        placeholder={t`abc123...`}
        value={store.commitSha}
        onInput={(e) => (store.commitSha = e.currentTarget.value)}
      />
    </div>
    <div class="form-group">
      <label htmlFor="source-extract-path">{t`Extract Path (for modpacks)`}</label>
      <input
        id="source-extract-path"
        type="text"
        placeholder={t`repo-main/path/to/mod`}
        value={store.extractPath}
        onInput={(e) => (store.extractPath = e.currentTarget.value)}
      />
      <small>{t`Path inside the archive where the mod is located`}</small>
    </div>
  </section>
)
