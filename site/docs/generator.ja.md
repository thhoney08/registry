---
layout: base.tsx
title: マニフェストジェネレーター
description: BN Modレジストリ向けYAMLマニフェスト生成ツール
id: docs-generator
lang: ja
url: /docs/generator/
---

<link rel="stylesheet" href="/manifest-generator.css" hash />

<h1>マニフェストジェネレーター</h1>

<p>
  このツールで、レジストリ投稿用のマニフェストYAMLを生成できます。
  フィールドを手入力するか、<code>modinfo.json</code> をアップロードするか、
  GitHub リポジトリから情報を取得できます。
</p>

<div id="manifest-generator">
  <noscript>
    <p>マニフェストジェネレーターにはJavaScriptが必要です。</p>
  </noscript>
</div>

<script type="module" src="/app/main.js"></script>
