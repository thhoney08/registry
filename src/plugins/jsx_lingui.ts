import { dirname } from "@std/path"
import { renderComponent } from "lume/deps/ssx.ts"
import type { RawData } from "lume/core/file.ts"
import type { Engine, Helper } from "lume/core/renderer.ts"
import type Site from "lume/core/site.ts"
import { transformLinguiMacroWithSwc } from "./lingui_swc.ts"

type Options = {
  extensions?: string[]
  pageSubExtension?: string
  includes?: string
}

const defaults: Required<Pick<Options, "extensions" | "pageSubExtension">> = {
  extensions: [".jsx", ".tsx"],
  pageSubExtension: ".page",
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype

const toData = (mod: Record<string, unknown>): RawData => {
  const data: RawData = {}

  for (const [name, value] of Object.entries(mod)) {
    if (name === "default") {
      if (isPlainObject(value)) {
        Object.assign(data, value)
      } else {
        data.content = value
      }
      continue
    }

    data[name] = value
  }

  return data
}

const transformLinguiMacro = async (path: string): Promise<{ path: string; isTemp: boolean }> => {
  const source = await Deno.readTextFile(path)
  const transformed = await transformLinguiMacroWithSwc(source, path, "lume")
  if (!transformed) return { path, isTemp: false }

  const tempPath = await Deno.makeTempFile({
    dir: dirname(path),
    prefix: ".lingui-macro-",
    suffix: path.endsWith(".tsx") ? ".tsx" : path.endsWith(".jsx") ? ".jsx" : ".ts",
  })
  await Deno.writeTextFile(tempPath, transformed)
  return { path: tempPath, isTemp: true }
}

const moduleLoader = async (path: string): Promise<RawData> => {
  const isUrl = path.startsWith("http://") || path.startsWith("https://")
  const transformed = isUrl ? { path, isTemp: false } : await transformLinguiMacro(path)
  const importPath = transformed.path
  const url = isUrl ? importPath : `file://${importPath}`
  const specifier = Deno.env.get("LUME_LIVE_RELOAD") ? `${url}#${Date.now()}` : url

  try {
    const mod = await import(specifier)
    return toData(mod)
  } finally {
    if (transformed.isTemp) {
      await Deno.remove(transformed.path).catch(() => undefined)
    }
  }
}

class JsxEngine implements Engine {
  helpers: Record<string, Helper> = {}
  basePath: string
  includes: string

  constructor(basePath: string, includes: string) {
    this.basePath = basePath
    this.includes = includes
  }

  async render(content: unknown, data: Record<string, unknown> = {}) {
    if (typeof content === "string") {
      content = { __html: content }
    }

    let children = data.content ?? data.children
    if (typeof children === "string") {
      children = { __html: children }
    }

    const result = typeof content === "function"
      ? await content({ ...data, children }, this.helpers)
      : content

    return typeof result === "string" ? result : renderComponent(result)
  }

  deleteCache() {}

  addHelper(name: string, fn: Helper) {
    this.helpers[name] = fn
  }
}

export const jsxLingui = (userOptions: Options = {}) => (site: Site) => {
  const options = {
    ...defaults,
    includes: site.options.includes,
    ...userOptions,
  }

  const engine = new JsxEngine(site.src("/"), options.includes)

  if (options.includes) {
    site.ignore(options.includes)
  }

  site.loadPages(options.extensions, {
    loader: moduleLoader,
    engine,
    pageSubExtension: options.pageSubExtension,
  })
}
