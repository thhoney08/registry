export const appendCommittedTag = (tags: string[], draft: string): string[] => {
  const tag = draft.trim()
  return tag ? [...tags, tag] : tags
}
