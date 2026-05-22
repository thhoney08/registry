/// <reference lib="dom" />
/**
 * Version form section for version, game version, and dependencies.
 */

import { t } from "@lingui/core/macro"
import type { JSX } from "preact"
import { store } from "./store.ts"

const dependencyRows = (): [string, string][] =>
  store.dependencies.map(([id, version]) => [id, version] as [string, string])

const setDependency = (index: number, field: 0 | 1, value: string) => {
  store.dependencies = dependencyRows().map((dependency, currentIndex) =>
    currentIndex === index
      ? field === 0 ? [value, dependency[1]] : [dependency[0], value]
      : dependency
  )
}

export const VersionSection = () => (
  <section class="form-section">
    <h3>{t`Version`}</h3>
    <div class="form-group">
      <label htmlFor="manifest-version">{t`Version *`}</label>
      <input
        id="manifest-version"
        type="text"
        placeholder={t`1.0.0`}
        value={store.version}
        onInput={(e: JSX.TargetedEvent<HTMLInputElement>) => {
          store.version = e.currentTarget.value
        }}
      />
    </div>
    <div class="form-group">
      <p>{t`Dependencies`}</p>
      <div class="dependencies-list">
        {store.dependencies.map(([modId, version], index) => (
          <div class="dependency-row" key={index}>
            <input
              type="text"
              placeholder={t`mod_id`}
              value={modId}
              onInput={(e: JSX.TargetedEvent<HTMLInputElement>) => {
                setDependency(index, 0, e.currentTarget.value)
              }}
            />
            <input
              type="text"
              placeholder={t`version constraint`}
              value={version}
              onInput={(e: JSX.TargetedEvent<HTMLInputElement>) => {
                setDependency(index, 1, e.currentTarget.value)
              }}
            />
            <button
              type="button"
              class="btn-remove"
              onClick={() => {
                store.dependencies = dependencyRows().filter((
                  _,
                  currentIndex,
                ) =>
                  currentIndex !== index
                )
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
          store.dependencies = [...dependencyRows(), ["", ""]]
        }}
      >
        {t`+ Add Dependency`}
      </button>
    </div>
  </section>
)
