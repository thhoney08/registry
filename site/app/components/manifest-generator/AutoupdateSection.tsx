/// <reference lib="dom" />
/**
 * Autoupdate form section for automatic version updates.
 */

import { t } from "@lingui/core/macro"
import type { JSX } from "preact"
import { store } from "./store.ts"

export const AutoupdateSection = () => (
  <section class="form-section">
    <h3>{t`Autoupdate`}</h3>
    <div class="form-group">
      <div class="toggle-switch">
        <button
          type="button"
          role="switch"
          aria-checked={store.enableAutoupdate ? "true" : "false"}
          onClick={() => {
            store.enableAutoupdate = !store.enableAutoupdate
          }}
        />
        <span class="toggle-label">
          {t`Enable automatic updates from source repository`}
        </span>
      </div>
      <small>
        {t`When enabled, the registry will periodically check for new commits/releases and update the mod.`}
      </small>
    </div>
    {store.enableAutoupdate && (
      <>
        <div class="form-group">
          <p>{t`Update Strategy`}</p>
          <div class="radio-group">
            <label class="radio-option">
              <input
                type="radio"
                name="autoupdate-type"
                value="commit"
                checked={store.autoupdateType === "commit"}
                onChange={() => (store.autoupdateType = "commit")}
              />
              <span class="radio-content">
                <strong>{t`Track Branch`}</strong>
                <small>{t`Follow latest commits on a branch`}</small>
              </span>
            </label>
            <label class="radio-option">
              <input
                type="radio"
                name="autoupdate-type"
                value="tag"
                checked={store.autoupdateType === "tag"}
                onChange={() => (store.autoupdateType = "tag")}
              />
              <span class="radio-content">
                <strong>{t`Track Releases`}</strong>
                <small>{t`Follow tagged releases only`}</small>
              </span>
            </label>
          </div>
        </div>
        {store.autoupdateType === "commit" && (
          <div class="form-group">
            <label htmlFor="autoupdate-branch">{t`Branch`}</label>
            <input
              id="autoupdate-branch"
              type="text"
              placeholder={t`main`}
              value={store.autoupdateBranch}
              onInput={(e: JSX.TargetedEvent<HTMLInputElement>) => {
                store.autoupdateBranch = e.currentTarget.value
              }}
            />
          </div>
        )}
        {store.autoupdateType === "tag" && (
          <div class="form-group">
            <label htmlFor="autoupdate-tag-regex">
              {t`Tag Regex (optional)`}
            </label>
            <input
              id="autoupdate-tag-regex"
              type="text"
              placeholder={t`^v[0-9]+\.[0-9]+\.[0-9]+$`}
              value={store.autoupdateRegex}
              onInput={(e: JSX.TargetedEvent<HTMLInputElement>) => {
                store.autoupdateRegex = e.currentTarget.value
              }}
            />
            <small>
              {t`PCRE2 regex to filter tags. Only matching tags are considered for updates.`}
            </small>
          </div>
        )}
      </>
    )}
  </section>
)
