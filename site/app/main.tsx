/**
 * Manifest Generator Web App
 *
 * Interactive tool for generating mod manifest YAML files.
 * Uses Preact with signals for reactivity.
 */
import { render } from "preact"
import { ManifestGenerator } from "./components/ManifestGenerator.tsx"
import { initializeI18n } from "./components/manifest-generator/i18n.ts"

// Mount the app
const root = document.getElementById("manifest-generator")
if (root) {
  initializeI18n()
  render(<ManifestGenerator />, root)
}
