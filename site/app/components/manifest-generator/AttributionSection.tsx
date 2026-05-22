/// <reference lib="dom" />
/**
 * Attribution form section for author, license, homepage, and icon.
 */

import { t } from "@lingui/core/macro"
import type { JSX } from "preact"
import { store } from "./store.ts"
import { CommonLicenses } from "./types.ts"

const setAuthor = (index: number, value: string) => {
  store.author = store.author.map((author, currentIndex) => currentIndex === index ? value : author)
}

export const AttributionSection = () => (
  <section class="form-section">
    <h3>{t`Attribution`}</h3>
    <div class="form-group">
      <label htmlFor="author-0">{t`Author(s) *`}</label>
      <div class="dependencies-list">
        {store.author.map((author, index) => (
          <div class="dependency-row" key={index}>
            <input
              id={`author-${index}`}
              type="text"
              placeholder={t`Author ${index + 1}`}
              value={author}
              onInput={(e: JSX.TargetedEvent<HTMLInputElement>) => {
                setAuthor(index, e.currentTarget.value)
              }}
            />
            <button
              type="button"
              class="btn-remove"
              onClick={() => {
                store.author = store.author.filter((_, currentIndex) => currentIndex !== index)
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        class="btn-add"
        onClick={() => {
          store.author = [...store.author, ""]
        }}
      >
        {t`+ Add Author`}
      </button>
    </div>
    <div class="form-group">
      <label htmlFor="license">{t`License *`}</label>
      <select
        id="license"
        value={store.license}
        onChange={(e: JSX.TargetedEvent<HTMLSelectElement>) => {
          store.license = e.currentTarget.value
        }}
      >
        {CommonLicenses.map((lic) => (
          <option key={lic} value={lic}>
            {lic}
          </option>
        ))}
      </select>
    </div>
    <div class="form-group">
      <label htmlFor="homepage">{t`Homepage`}</label>
      <input
        id="homepage"
        type="url"
        placeholder="https://github.com/owner/repo"
        value={store.homepage}
        onInput={(e: JSX.TargetedEvent<HTMLInputElement>) => {
          store.homepage = e.currentTarget.value
        }}
      />
    </div>
    <div class="form-group">
      <label htmlFor="icon-url">{t`Icon URL`}</label>
      <input
        id="icon-url"
        type="url"
        placeholder="https://example.com/icon.svg"
        value={store.iconUrl}
        onInput={(e: JSX.TargetedEvent<HTMLInputElement>) => {
          store.iconUrl = e.currentTarget.value
        }}
      />
      <small>
        {t`URL to icon image (PNG/SVG/WebP/AVIF/JPG/GIF, recommended 160x160)`}
      </small>
    </div>
  </section>
)
