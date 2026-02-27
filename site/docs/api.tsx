export const title = "API Documentation"
export const description = "OpenAPI specification and API endpoints for the BN Mod Registry"
export const layout = "base.tsx"
export const id = "docs-api"
export const lang = ["en", "ko", "ja"]

type Locale = "en" | "ko" | "ja"

const text = {
  en: {
    title: "API Documentation",
    intro: "The BN Mod Registry provides a simple JSON API for accessing mod metadata.",
    endpoints: "Available Endpoints",
    allJson: "All mods as JSON array",
    allMarkdown: "All mods as Markdown table",
    openApi: "OpenAPI specification",
    schema: "JSON Schema for mod manifests",
    openApiHeading: "OpenAPI Specification",
  },
  ko: {
    title: "API 문서",
    intro: "BN 모드 저장소는 모드 메타데이터를 조회할 수 있는 간단한 JSON API를 제공합니다.",
    endpoints: "사용 가능한 엔드포인트",
    allJson: "모든 모드 JSON 배열",
    allMarkdown: "모든 모드 Markdown 표",
    openApi: "OpenAPI 명세",
    schema: "모드 명세서 JSON 스키마",
    openApiHeading: "OpenAPI 명세",
  },
  ja: {
    title: "APIドキュメント",
    intro: "BN Modレジストリは、ModメタデータにアクセスできるシンプルなJSON APIを提供します。",
    endpoints: "利用可能なエンドポイント",
    allJson: "すべてのModをJSON配列で取得",
    allMarkdown: "すべてのModをMarkdown表で取得",
    openApi: "OpenAPI仕様",
    schema: "Modマニフェスト用JSONスキーマ",
    openApiHeading: "OpenAPI仕様",
  },
} as const

const SWAGGER_UI_CSS = "https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"
const SWAGGER_UI_JS = "https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"

export default ({ lang: currentLang = "en" }: Lume.Data) => {
  const lang = (currentLang as Locale) in text ? currentLang as Locale : "en"
  const t = text[lang]

  const initScript = `
    window.addEventListener('DOMContentLoaded', () => {
      window.SwaggerUIBundle({
        url: "/generated/openapi.json",
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        deepLinking: true,
        tryItOutEnabled: false
      });
    });
  `

  return (
    <>
      <h1>{t.title}</h1>
      <p>
        {t.intro}
      </p>

      <h2>{t.endpoints}</h2>
      <ul>
        <li>
          <a href="/generated/mods.json">
            <code>mods.json</code>
          </a>{" "}
          - {t.allJson}
        </li>
        <li>
          <a href="/generated/mods.md">
            <code>mods.md</code>
          </a>{" "}
          - {t.allMarkdown}
        </li>
        <li>
          <a href="/generated/openapi.json">
            <code>openapi.json</code>
          </a>{" "}
          - {t.openApi}
        </li>
        <li>
          <a href="/generated/mod_manifest.schema.json">
            <code>mod_manifest.schema.json</code>
          </a>{" "}
          - {t.schema}
        </li>
      </ul>

      <h2>{t.openApiHeading}</h2>
      <link rel="stylesheet" href={SWAGGER_UI_CSS} />
      <script src={SWAGGER_UI_JS}></script>
      <script dangerouslySetInnerHTML={{ __html: initScript }} />
      <div id="swagger-ui"></div>
    </>
  )
}
