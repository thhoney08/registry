import { assertEquals, assertStrictEquals } from "@std/assert"
import { appendCommittedTag } from "./tags.ts"

Deno.test("appendCommittedTag appends trimmed draft tags", () => {
  assertEquals(appendCommittedTag(["content"], " magic "), ["content", "magic"])
})

Deno.test("appendCommittedTag ignores empty draft tags", () => {
  const tags = ["content"]
  assertStrictEquals(appendCommittedTag(tags, "  "), tags)
})
