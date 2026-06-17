---
name: add-registry
description: Add or update Cataclysm: Bright Nights mod registry manifests, especially entries that should appear on mods.cataclysmbn.org.
---

# Add Registry Manifest

Use this skill when adding or updating files under `registry-index/manifests`.

## Workflow

1. Confirm the source repo, mod folder, `modinfo.json`, license, version, Lua usage, dependencies, and parent/submod relationship from source files.
2. Add or edit the YAML manifest in `registry-index/manifests` using the manifest `id` as the filename.
3. Run `deno task validate` from the registry repo root.
4. Commit only the intended manifest/source changes. Do not include generated file noise unless the task explicitly asks for generated outputs.
5. If the user expects the entry on `https://mods.cataclysmbn.org`, push the `registry-index` commit, trigger or wait for the registry site deploy, and verify the canonical live URL before saying it is live.
6. If the deploy is not completed and verified, state that the change is local or pushed-only and not visible on the live site yet.
