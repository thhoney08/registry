import type { OnLoadArgs, Plugin, PluginBuild } from "esbuild"
import { transformLinguiMacroWithSwc } from "./lingui_swc.ts"

const getLoader = (path: string): "js" | "jsx" | "ts" | "tsx" => {
  if (path.endsWith(".tsx")) return "tsx"
  if (path.endsWith(".jsx")) return "jsx"
  if (path.endsWith(".ts")) return "ts"
  return "js"
}

export const linguiMacroPlugin = (): Plugin => ({
  name: "lingui-macro",
  setup: (build: PluginBuild) => {
    const appRoot = `${Deno.cwd()}/site/app/`

    build.onLoad({ filter: /\.[jt]sx?$/ }, async (args: OnLoadArgs) => {
      if (!args.path.startsWith(appRoot)) {
        return null
      }

      const source = await Deno.readTextFile(args.path)
      const usesLinguiMacro = source.includes("@lingui/core/macro") ||
        source.includes("@lingui/react/macro")

      if (!usesLinguiMacro) {
        return null
      }

      const transformed = await transformLinguiMacroWithSwc(source, args.path, "preact")

      return {
        contents: transformed ?? source,
        loader: getLoader(args.path),
      }
    })
  },
})
