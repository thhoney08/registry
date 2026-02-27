import { i18n } from "@lingui/core"
import { messages as enMessages } from "../../locales/en/messages.ts"
import { messages as koMessages } from "../../locales/ko/messages.ts"
import { messages as jaMessages } from "../../locales/ja/messages.ts"

type Locale = "en" | "ko" | "ja"

const detectLocale = (): Locale => {
  const lang = document.documentElement.lang.toLowerCase()
  if (lang.startsWith("ko")) return "ko"
  if (lang.startsWith("ja")) return "ja"
  return "en"
}

let isInitialized = false

export const initializeI18n = (): void => {
  if (isInitialized) return

  i18n.load({
    en: enMessages,
    ko: koMessages,
    ja: jaMessages,
  })
  i18n.activate(detectLocale())
  isInitialized = true
}
