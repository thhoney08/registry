/// <reference lib="dom" />
/**
 * File upload section for importing modinfo.json files.
 */

import { t } from "@lingui/core/macro"

interface FileUploadProps {
  onFileUpload: (e: Event) => void
}

export const FileUpload = ({ onFileUpload }: FileUploadProps) => (
  <section class="form-section import-section">
    <h3>{t`Or Upload modinfo.json`}</h3>
    <div class="form-group">
      <input type="file" accept=".json" onChange={onFileUpload} />
    </div>
  </section>
)
