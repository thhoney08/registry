/// <reference lib="dom" />
/**
 * Identity form section for mod ID, name, and descriptions.
 */

import { store } from "./store.ts"
import { t } from "@lingui/core/macro"

export const IdentitySection = () => (
  <section class="form-section">
    <h3>{t`Identity`}</h3>
    <div class="form-group">
      <label htmlFor="manifest-id">{t`ID *`}</label>
      <input
        id="manifest-id"
        type="text"
        placeholder={t`my_mod`}
        value={store.id}
        onInput={(e) => (store.id = e.currentTarget.value)}
      />
      <small>{t`Lowercase alphanumeric with underscores`}</small>
    </div>
    <div class="form-group">
      <label htmlFor="manifest-display-name">{t`Display Name *`}</label>
      <input
        id="manifest-display-name"
        type="text"
        placeholder={t`My Mod`}
        value={store.displayName}
        onInput={(e) => (store.displayName = e.currentTarget.value)}
      />
    </div>
    <div class="form-group">
      <label htmlFor="manifest-short-description">{t`Short Description *`}</label>
      <input
        id="manifest-short-description"
        type="text"
        maxLength={200}
        placeholder={t`A brief description of your mod`}
        value={store.shortDescription}
        onInput={(e) => (store.shortDescription = e.currentTarget.value)}
      />
      <small>{t`${store.shortDescription.length}/200 characters`}</small>
    </div>
    <div class="form-group">
      <label htmlFor="manifest-description">{t`Full Description`}</label>
      <textarea
        id="manifest-description"
        placeholder={t`Detailed description...`}
        value={store.description}
        onInput={(e) => (store.description = e.currentTarget.value)}
      />
    </div>
  </section>
)
