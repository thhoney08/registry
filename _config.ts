import lume from "lume/mod.ts"
import date from "lume/plugins/date.ts"
import pagefind from "lume/plugins/pagefind.ts"
import { jsxLingui } from "./src/plugins/jsx_lingui.ts"
import metas from "lume/plugins/metas.ts"
import sitemap from "lume/plugins/sitemap.ts"
import esbuild from "lume/plugins/esbuild.ts"
import relativeUrls from "lume/plugins/relative_urls.ts"
import minifyHTML from "lume/plugins/minify_html.ts"
import robots from "lume/plugins/robots.ts"
import jsonLd from "lume/plugins/json_ld.ts"
import multilanguage from "lume/plugins/multilanguage.ts"
import { linguiMacroPlugin } from "./src/plugins/esbuild_lingui_macro.ts"

const site = lume({ src: "./site", dest: "./_site" })

// Bundle Preact app for manifest generator (must be before metas)
site.add("app/main.tsx")
site.use(esbuild({
  denoConfig: "site/app/deno.json",
  options: {
    sourcemap: "both",
    minify: true,
    define: { "process.env.NODE_ENV": '"production"' },
    plugins: [linguiMacroPlugin()],
  },
}))

// Core plugins
site.use(relativeUrls())
site.use(multilanguage({
  languages: ["en", "ko", "ja"],
  defaultLanguage: "en",
}))
site.use(date())

site.use(pagefind({
  ui: {
    containerId: "search",
    showImages: false,
    showEmptyFilters: false,
    resetStyles: true,
  },
}))

const getPagefindInitScript = (section: "docs" | "mod"): string => `
window.addEventListener("DOMContentLoaded", () => {
  const search = new PagefindUI({
    element: "#search",
    showImages: false,
    showEmptyFilters: false,
    resetStyles: true,
    bundlePath: "/pagefind/",
    baseUrl: "/",
  });
  search.triggerFilters({ section: ["${section}"] });
});
`

site.process([".html"], (pages) => {
  for (const page of pages) {
    const { document } = page
    if (!document) continue

    const searchContainer = document.getElementById("search")
    if (!searchContainer) continue

    const isDocsPage = Boolean(
      document.querySelector("meta[data-pagefind-filter='section:docs']"),
    )
    const section = isDocsPage ? "docs" : "mod"

    const scripts = document.querySelectorAll("script")
    for (const script of scripts) {
      if (!script.innerHTML?.includes("new PagefindUI")) continue
      script.innerHTML = getPagefindInitScript(section)
      break
    }
  }
})

site.use(jsxLingui())
site.use(metas())
site.use(sitemap())
site.use(robots())
site.use(jsonLd())
site.use(minifyHTML())

site.copy("generated")
site.copy("assets")
site.copy("styles.css")
site.copy("manifest-generator.css")

// Global data
site.data("layout", "base.tsx")
site.data("siteName", "BN Mod Registry")
site.data(
  "siteDescription",
  "Community mod registry for Cataclysm: Bright Nights",
)
site.data("siteUrl", "https://cataclysmbn.github.io/registry")

export default site
