export const layout = undefined

type Locale = "en" | "ko" | "ja"

const languageNames: Record<Locale, string> = {
  en: "English",
  ko: "한국어",
  ja: "日本語",
}

const locales: Locale[] = ["en", "ko", "ja"]

type Alternate = { lang?: string; url?: string }

const getAlternateUrl = (
  alternates: unknown,
  targetLang: Locale,
  fallback: string,
): string => {
  if (Array.isArray(alternates)) {
    const match = alternates.find((entry) => {
      const alt = entry as Partial<Alternate>
      return alt.lang === targetLang
    }) as Partial<Alternate> | undefined
    if (typeof match?.url === "string" && match.url.length > 0) return match.url
  }

  if (alternates && typeof alternates === "object") {
    const map = alternates as Record<string, Partial<Alternate>>
    const mapped = map[targetLang]
    if (typeof mapped?.url === "string" && mapped.url.length > 0) return mapped.url
  }

  return fallback
}

const stripLocalePrefix = (path: string, lang: Locale): string => {
  if (lang === "en") return path
  const prefix = `/${lang}`
  if (path === prefix) return "/"
  if (path.startsWith(`${prefix}/`)) return path.slice(prefix.length)
  return path
}

const ui = {
  en: {
    skipToContent: "Skip to content",
    nav: { home: "Home", mods: "Mods", docs: "Docs", api: "API", addMod: "Add Mod" },
    aria: {
      toggleTheme: "Toggle dark/light theme",
      toggleMenu: "Toggle menu",
      backToTop: "Back to top",
      languageMenu: "Language selector",
    },
    footer: {
      play: "Play Cataclysm: Bright Nights",
      copyright: "2025 © Cataclysm: Bright Nights Contributors",
    },
  },
  ko: {
    skipToContent: "본문으로 건너뛰기",
    nav: { home: "홈", mods: "모드", docs: "문서", api: "API", addMod: "모드 추가" },
    aria: {
      toggleTheme: "다크/라이트 테마 전환",
      toggleMenu: "메뉴 열기 또는 닫기",
      backToTop: "맨 위로 이동",
      languageMenu: "언어 선택",
    },
    footer: {
      play: "카타클리즘: 밝은 밤 플레이",
      copyright: "2025 © Cataclysm: Bright Nights 기여자",
    },
  },
  ja: {
    skipToContent: "本文へスキップ",
    nav: { home: "ホーム", mods: "Mod", docs: "ドキュメント", api: "API", addMod: "Mod追加" },
    aria: {
      toggleTheme: "ダーク/ライトテーマを切り替え",
      toggleMenu: "メニューを開閉",
      backToTop: "ページ先頭へ戻る",
      languageMenu: "言語選択",
    },
    footer: {
      play: "Cataclysm: Bright Nights をプレイ",
      copyright: "2025 © Cataclysm: Bright Nights コントリビューター",
    },
  },
} as const

const withLangPrefix = (lang: Locale, path: string): string =>
  lang === "en" ? path : `/${lang}${path === "/" ? "" : path}`

export default (
  { title, description, siteName, siteDescription, children, url, lang = "en", alternates = [] }:
    Lume.Data,
  _helpers: Lume.Helpers,
) => {
  const locale = (lang as Locale) in ui ? (lang as Locale) : "en"
  const text = ui[locale]
  const homeUrl = withLangPrefix(locale, "/")
  const modsUrl = withLangPrefix(locale, "/mods/")
  const docsUrl = withLangPrefix(locale, "/docs/")
  const apiUrl = withLangPrefix(locale, "/api/")
  const addModUrl = withLangPrefix(locale, "/docs/generator/")

  const safeUrl = typeof url === "string" && url.length > 0 ? url : "/"
  const path = stripLocalePrefix(safeUrl, locale)
  const languageOptions = locales.map((localeOption) => ({
    locale: localeOption,
    url: getAlternateUrl(
      alternates,
      localeOption,
      withLangPrefix(localeOption, path),
    ),
  }))

  // Determine page type for search indexing
  const isMod = url?.startsWith("/mods/") && url !== "/mods/"
  const isDoc = url?.startsWith("/docs/")
  // Only index mod and doc pages, not index/list pages
  const shouldIndex = isMod || isDoc

  // Theme initialization script (runs immediately to prevent flash)
  const themeScript = `
    const changeHighlight = () => {
      const light = document.getElementById("highlight-theme-light")
      if (light) light.disabled = theme === "dark"
      const dark = document.getElementById("highlight-theme-dark")
      if (dark) dark.disabled = theme === "light"
    }
    let theme = localStorage.getItem("theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    changeHighlight()
    document.documentElement.dataset.theme = theme
    function changeTheme() {
      theme = theme === "dark" ? "light" : "dark"
      localStorage.setItem("theme", theme)
      document.documentElement.dataset.theme = theme
      changeHighlight()
    }
    function toggleMenu() {
      const menu = document.getElementById("nav-menu")
      const hamburger = document.querySelector(".hamburger")
      if (menu) {
        menu.classList.toggle("open")
        hamburger?.classList.toggle("open")
      }
    }
    document.addEventListener('DOMContentLoaded', () => {
      const btn = document.getElementById('back-to-top');
      if (btn) {
        btn.addEventListener('click', () => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
    });
  `

  return (
    <>
      {{ __html: "<!DOCTYPE html>" }}
      <html lang={locale}>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>{title} | {siteName}</title>
          <meta name="description" content={description || siteDescription} />
          {/* Theme color meta tags for browser chrome */}
          <meta name="supported-color-schemes" content="light dark" />
          <meta
            name="theme-color"
            content="hsl(220, 20%, 100%)"
            media="(prefers-color-scheme: light)"
          />
          <meta
            name="theme-color"
            content="hsl(220, 20%, 10%)"
            media="(prefers-color-scheme: dark)"
          />
          {/* Pagefind section filter */}
          {isMod && <meta data-pagefind-filter="section:mod" />}
          {isDoc && <meta data-pagefind-filter="section:docs" />}
          {/* Theme script - must run before body to prevent flash */}
          <script dangerouslySetInnerHTML={{ __html: themeScript }} />
          {/* Our styles (imports @lumeland/ds) */}
          <link rel="stylesheet" href="/assets/styles.css?v=20260604b" />
          <link
            id="highlight-theme-light"
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.6.0/build/styles/github.min.css"
          />
          <link
            id="highlight-theme-dark"
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.6.0/build/styles/dark.min.css"
          />
        </head>
        <body data-instant-intensity="viewport-all">
          {/* Skip to main content link for accessibility */}
          <a href="#main-content" class="skip-link">{text.skipToContent}</a>
          <nav data-pagefind-ignore>
            <ul>
              <li class="logo">
                <a href={homeUrl}>{text.nav.home}</a>
              </li>
              <li class="nav-menu-wrapper">
                <ul class="nav-menu" id="nav-menu">
                  <li>
                    <a href={modsUrl}>{text.nav.mods}</a>
                  </li>
                  <li>
                    <a href={docsUrl}>{text.nav.docs}</a>
                  </li>
                  <li>
                    <a href={apiUrl}>{text.nav.api}</a>
                  </li>
                  <li>
                    <a href={addModUrl}>{text.nav.addMod}</a>
                  </li>
                </ul>
              </li>
              <li class="nav-actions">
                <ul class="nav-actions-list">
                  <li class="nav-search" id="search"></li>
                  <li class="btn-add-wrapper">
                    <a href={addModUrl} class="btn-add">{text.nav.addMod}</a>
                  </li>
                  {languageOptions.length > 0 && (
                    <li>
                      <label aria-label={text.aria.languageMenu} class="language-menu">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 16"
                          width="20"
                          height="20"
                          fill="currentColor"
                          class="language-icon"
                          aria-hidden="true"
                        >
                          <title>{text.aria.languageMenu}</title>
                          <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM5.78 8.75a9.64 9.64 0 0 0 1.363 4.177c.255.426.542.832.857 1.215.245-.296.551-.705.857-1.215A9.64 9.64 0 0 0 10.22 8.75Zm4.44-1.5a9.64 9.64 0 0 0-1.363-4.177c-.307-.51-.612-.919-.857-1.215a9.927 9.927 0 0 0-.857 1.215A9.64 9.64 0 0 0 5.78 7.25Zm-5.944 1.5H1.543a6.507 6.507 0 0 0 4.666 5.5c-.123-.181-.24-.365-.352-.552-.715-1.192-1.437-2.874-1.581-4.948Zm-2.733-1.5h2.733c.144-2.074.866-3.756 1.58-4.948.12-.197.237-.381.353-.552a6.507 6.507 0 0 0-4.666 5.5Zm10.181 1.5c-.144 2.074-.866 3.756-1.58 4.948-.12.197-.237.381-.353.552a6.507 6.507 0 0 0 4.666-5.5Zm2.733-1.5a6.507 6.507 0 0 0-4.666-5.5c.123.181.24.365.353.552.714 1.192 1.436 2.874 1.58 4.948Z" />
                        </svg>
                        <select
                          class="language-select"
                          onchange="const target = this.options[this.selectedIndex]?.dataset.url; if (target) window.location.href = target"
                          value={locale}
                          aria-label={text.aria.languageMenu}
                        >
                          {languageOptions.map((option) => (
                            <option value={option.locale} key={option.locale} data-url={option.url}>
                              {languageNames[option.locale]}
                            </option>
                          ))}
                        </select>
                      </label>
                    </li>
                  )}
                  <li class="theme-toggle">
                    <button
                      type="button"
                      aria-label={text.aria.toggleTheme}
                      class="btn-theme"
                      onclick="changeTheme()"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        width="20"
                        height="20"
                        fill="currentColor"
                      >
                        <title>Theme</title>
                        <path d="M14.53 10.53a7 7 0 0 1-9.058-9.058A7.003 7.003 0 0 0 8 15a7.002 7.002 0 0 0 6.53-4.47Z" />
                      </svg>
                    </button>
                  </li>
                  <li class="hamburger-wrapper">
                    <button
                      type="button"
                      aria-label={text.aria.toggleMenu}
                      class="hamburger"
                      onclick="toggleMenu()"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        width="24"
                        height="24"
                        fill="currentColor"
                      >
                        <title>Menu</title>
                        <path d="M1 2.75A.75.75 0 0 1 1.75 2h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 2.75Zm0 5A.75.75 0 0 1 1.75 7h12.5a.75.75 0 0 1 0 1.5H1.75A.75.75 0 0 1 1 7.75ZM1.75 12h12.5a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1 0-1.5Z" />
                      </svg>
                    </button>
                  </li>
                </ul>
              </li>
            </ul>
          </nav>

          <main id="main-content" data-pagefind-body={shouldIndex ? "" : undefined}>
            {children}
          </main>

          <footer data-pagefind-ignore>
            <p>
              <a href="https://github.com/cataclysmbn/registry">BN Mod Registry</a>
              {" · "}
              <a href="https://github.com/cataclysmbn/Cataclysm-BN">
                {text.footer.play}
              </a>
              {" · "}
              <a href="https://discord.gg/XW7XhXuZ89">Discord</a>
            </p>
            <p>
              {text.footer.copyright}
            </p>
          </footer>

          {/* Back to Top Button */}
          <button
            id="back-to-top"
            class="back-to-top"
            type="button"
            aria-label={text.aria.backToTop}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              width="24"
              height="24"
              fill="currentColor"
            >
              <title>Back to top</title>
              <path d="M3.47 7.78a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0l4.25 4.25a.751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018L9 4.81v7.44a.75.75 0 0 1-1.5 0V4.81L4.53 7.78a.75.75 0 0 1-1.06 0Z" />
            </svg>
          </button>

          {/* instant.page - preload pages on hover for instant navigation */}
          <script
            src="//instant.page/5.2.0"
            type="module"
            integrity="sha384-jnZyxPjiipYXnSU0ygqeac2q7CVYMbh84q0uHVRRxEtvFPiQYbXWUorga2aqZJ0z"
          />
        </body>
      </html>
    </>
  )
}
