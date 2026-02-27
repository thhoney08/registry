---
layout: base.tsx
title: Mod投稿
id: docs-submit
lang: ja
url: /docs/submit/
---

# レジストリへModを投稿する

以下の手順でModを登録できます。

## 事前準備

- ModはGitHub（または他のgitホスト）で公開されている必要があります。
- Pull Request作成用のGitHubアカウントが必要です。

## ステップ1: Registryをfork

1. [github.com/cataclysmbn/registry](https://github.com/cataclysmbn/registry) を開く
2. **Fork** をクリック

## ステップ2: マニフェスト作成

### 方法A: Webジェネレーター（推奨）

[Manifest Generator](./generator/) を使うと、入力支援とGitHub情報の自動取得ができます。

### 方法B: CLI fetch コマンド

```bash
git clone https://github.com/YOUR_USERNAME/registry.git
cd registry

deno task fetch https://github.com/yourname/your-mod
# または
deno task fetch yourname/your-mod
```

### 方法C: 手動作成

`registry-index/manifests/your_mod_id.yaml` を作成し、必要フィールドを記入します。

## ステップ3: マニフェスト検証

```bash
deno task validate registry-index/manifests/your_mod_id.yaml
deno task check-urls registry-index/manifests/your_mod_id.yaml
```

## ステップ4: Pull Request 作成

1. マニフェストをコミット
2. fork先へpush
3. 本家リポジトリへPull Requestを作成

## 補足

- 必須フィールド: `schema_version`, `id`, `display_name`, `short_description`, `author`, `license`, `version`, `source.type`, `source.url`
- Modpack内Modは `source.extract_path` を指定してください。
- 自動更新を使う場合は `autoupdate` ブロックを追加してください。
