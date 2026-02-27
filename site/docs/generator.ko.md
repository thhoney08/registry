---
layout: base.tsx
title: 명세서 생성기
description: BN 모드 저장소용 YAML 명세서 파일 생성 도구
id: docs-generator
lang: ko
url: /docs/generator/
---

<link rel="stylesheet" href="/manifest-generator.css" />

<h1>명세서 생성기</h1>

<p>
  이 도구로 저장소에 제출할 모드 명세서 YAML 파일을 생성할 수 있습니다.
  필드를 직접 입력하거나, <code>modinfo.json</code> 파일을 업로드하거나,
  GitHub 저장소에서 정보를 가져올 수 있습니다.
</p>

<div id="manifest-generator">
  <noscript>
    <p>명세서 생성기를 사용하려면 JavaScript가 필요합니다.</p>
  </noscript>
</div>

<script type="module" src="/app/main.js"></script>
