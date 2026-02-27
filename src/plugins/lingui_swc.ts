import { transform } from "npm:@swc/core@^1.15.11"

const usesLinguiMacro = (source: string): boolean =>
  source.includes("@lingui/core/macro") || source.includes("@lingui/react/macro")

const isTsx = (filePath: string): boolean => filePath.endsWith(".tsx")
const isJsx = (filePath: string): boolean => filePath.endsWith(".jsx")
const isTs = (filePath: string): boolean => filePath.endsWith(".ts") || isTsx(filePath)

const getParser = (filePath: string) => {
  if (isTs(filePath)) {
    return {
      syntax: "typescript" as const,
      tsx: isTsx(filePath),
      decorators: false,
    }
  }

  return {
    syntax: "ecmascript" as const,
    jsx: isJsx(filePath),
  }
}

export const transformLinguiMacroWithSwc = async (
  source: string,
  path: string,
  jsxImportSource: string,
): Promise<string | null> => {
  if (!usesLinguiMacro(source)) return null

  const transformed = await transform(source, {
    filename: path,
    sourceMaps: false,
    module: {
      type: "es6",
    },
    jsc: {
      parser: getParser(path),
      transform: {
        react: {
          runtime: "automatic",
          importSource: jsxImportSource,
          development: false,
        },
      },
      experimental: {
        plugins: [["@lingui/swc-plugin", {}]],
      },
    },
  })

  return transformed.code
}
