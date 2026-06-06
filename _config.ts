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
import cacheBusting from "https://cdn.jsdelivr.net/gh/lumeland/experimental-plugins@2a2441fa5300d1ffafe6ba60876919da00a48d48/cache_busting/mod.ts"
import * as posix from "@std/path/posix"
import { linguiMacroPlugin } from "./src/plugins/esbuild_lingui_macro.ts"

const site = lume({ src: "./site", dest: "./_site" })

// Bundle client scripts (must be before metas)
site.add("app/main.tsx")
site.add("mods/filter.ts")
site.use(esbuild({
  denoConfig: "site/app/deno.json",
  options: {
    sourcemap: "both",
    minify: true,
    entryNames: "[dir]/[name]-[hash]",
    chunkNames: "chunks/[name]-[hash]",
    assetNames: "assets/[name]-[hash]",
    define: { "process.env.NODE_ENV": '"production"' },
    plugins: [linguiMacroPlugin()],
  },
}))

// Core plugins
site.use(cacheBusting())
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

const bundledScriptSources = new Map([
  ["/app/main.js", ["app/main.tsx", "/app/main.tsx"]],
  ["/mods/filter.js", ["mods/filter.ts", "/mods/filter.ts"]],
])

const toRootPath = (path: string): string => path.startsWith("/") ? path : `/${path}`
const withoutSearch = (path: string): string => path.split(/[?#]/, 1)[0]

const resolvePagePath = (pagePath: string, path: string): string => {
  const cleanPath = withoutSearch(path)
  if (cleanPath.startsWith("/")) return cleanPath
  const pageDir = posix.dirname(toRootPath(pagePath))
  return toRootPath(posix.normalize(posix.join(pageDir, cleanPath)))
}

const relativeToPage = (pagePath: string, targetPath: string): string => {
  const pageDir = posix.dirname(toRootPath(pagePath))
  return posix.relative(pageDir, toRootPath(targetPath)) || posix.basename(targetPath)
}

site.process([".html"], (pages, allPages) => {
  const bundledScriptUrls = new Map(
    [...bundledScriptSources].map(([originalUrl, sourcePaths]) => [
      originalUrl,
      toRootPath(
        allPages.find((page) => sourcePaths.includes(page.sourcePath))?.data.url as string ??
          originalUrl,
      ),
    ]),
  )

  for (const page of pages) {
    const { document } = page
    if (!document) continue

    for (const script of document.querySelectorAll("script[src]")) {
      const source = script.getAttribute("src")
      if (!source) continue
      const bundledUrl = bundledScriptUrls.get(resolvePagePath(page.outputPath, source))
      if (bundledUrl) script.setAttribute("src", relativeToPage(page.outputPath, bundledUrl))
    }
  }
})

site.use(minifyHTML())

site.copy("generated")
site.copy([".svg", ".txt"])
site.add("assets/styles.css")
site.add("manifest-generator.css")

// Global data
site.data("layout", "base.tsx")
site.data("siteName", "BN Mod Registry")
site.data(
  "siteDescription",
  "Community mod registry for Cataclysm: Bright Nights",
)
site.data("siteUrl", "https://cataclysmbn.github.io/registry")

export default site
