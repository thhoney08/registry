/// <reference lib="dom" />

import { computed } from "@preact/signals"
import { manifestYaml } from "../ManifestGenerator.tsx"
import { t } from "@lingui/core/macro"

interface ManifestOutputProps {
  copied: boolean
  onCopy: () => void
}

const codeBlock = computed(() => manifestYaml.value)

/**
 * Output section showing the generated YAML manifest.
 */
export const ManifestOutput = (
  { copied, onCopy }: ManifestOutputProps,
) => {
  return (
    <aside class="manifest-output">
      <div class="output-header">
        <h3>{t`Generated Manifest`}</h3>
        <button type="button" class="button is-secondary" onClick={onCopy}>
          {copied ? t`✓ Copied!` : t`Copy`}
        </button>
      </div>
      <pre>
        <code>{codeBlock.value}</code>
      </pre>
    </aside>
  )
}
