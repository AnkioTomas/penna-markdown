/** 标题文本 → slug：非法字符替换为 `-`。 */
export function slugify(text: string): string {
  const slug = text
    .trim()
    .replace(/[^\w\u4e00-\u9fff-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "heading";
}

/** 文档序去重：重复 slug 追加 `-1`、`-2`… */
export function assignSlug(text: string, used: Set<string>): string {
  const base = slugify(text);
  if (!used.has(base)) {
    used.add(base);
    return base;
  }

  let index = 1;
  while (used.has(`${base}-${index}`)) {
    index += 1;
  }
  const id = `${base}-${index}`;
  used.add(id);
  return id;
}

export function createSlugRegistry(): Set<string> {
  return new Set<string>();
}
