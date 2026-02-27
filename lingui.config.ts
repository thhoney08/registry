import { defineConfig } from "@lingui/cli"
import { formatter } from "@lingui/format-po"

export default defineConfig({
  locales: ["en", "ko", "ja"],
  sourceLocale: "en",
  fallbackLocales: {
    default: "en",
  },
  catalogs: [
    {
      path: "site/app/locales/{locale}/messages",
      include: ["site/app/components", "site/index.page.tsx"],
    },
  ],
  format: formatter({
    lineNumbers: false,
  }),
})
