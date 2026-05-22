/// <reference lib="dom" />
/**
 * Categories and tags form section.
 */

import { signal } from "@preact/signals"
import { t } from "@lingui/core/macro"
import type { JSX } from "preact"
import { store } from "./store.ts"
import { appendCommittedTag } from "./tags.ts"
import { MOD_CATEGORIES } from "./types.ts"

const tagDraft = signal("")
const addingTag = signal(false)

const resetTagInput = () => {
  tagDraft.value = ""
  addingTag.value = false
}

const commitTag = () => {
  store.tags = appendCommittedTag(store.tags, tagDraft.value)
  resetTagInput()
}

const toggleCategory = (cat: string) => {
  if (store.categories.includes(cat)) {
    store.categories = store.categories.filter((c) => c !== cat)
  } else {
    store.categories = [...store.categories, cat]
  }
}

export const CategoriesSection = () => (
  <section class="form-section">
    <h3>{t`Categories and Tags`}</h3>
    <div class="form-group">
      <p>{t`Categories`}</p>
      <div class="category-filters">
        {MOD_CATEGORIES.map((cat) => (
          <label class="category-checkbox" key={cat}>
            <input
              type="checkbox"
              checked={store.categories.includes(cat)}
              onChange={() => toggleCategory(cat)}
            />
            {cat}
          </label>
        ))}
      </div>
    </div>
    <div class="form-group">
      <p>{t`Tags`}</p>
      <div class="badge-group">
        {store.tags.map((tag, index) => (
          <span key={index} class="badge badge-tag">
            {tag}
            <button
              type="button"
              class="badge-remove"
              onClick={() =>
                store.tags.splice(index, 1)}
            >
              ×
            </button>
          </span>
        ))}
        {addingTag.value && (
          <div class="tag-input-wrapper">
            <input
              type="text"
              class="tag-input"
              placeholder={t`Enter tag`}
              value={tagDraft.value}
              autoFocus
              onBlur={commitTag}
              onInput={(e: JSX.TargetedEvent<HTMLInputElement>) => {
                tagDraft.value = e.currentTarget.value
              }}
              onKeyDown={(e: JSX.TargetedKeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  commitTag()
                }
                if (e.key === "Escape") resetTagInput()
              }}
            />
            <button
              type="button"
              class="badge-remove"
              onMouseDown={(e: JSX.TargetedMouseEvent<HTMLButtonElement>) =>
                e.preventDefault()}
              onClick={resetTagInput}
            >
              ×
            </button>
          </div>
        )}
        <button
          type="button"
          class="badge badge-add"
          onMouseDown={(e: JSX.TargetedMouseEvent<HTMLButtonElement>) => {
            if (addingTag.value) e.preventDefault()
          }}
          onClick={() => {
            if (addingTag.value) commitTag()
            else addingTag.value = true
          }}
        >
          {t`+ Add Tag`}
        </button>
      </div>
    </div>
  </section>
)
