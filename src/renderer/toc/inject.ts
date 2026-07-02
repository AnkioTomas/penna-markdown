import { assignSlug, createSlugRegistry } from "./slug.js";

/** 为预览 DOM 中的 heading 注入与 TOC 一致的 id。 */
export function injectHeadingIds(preview: HTMLElement): void {
  const used = createSlugRegistry();
  preview.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach((heading) => {
    const text = heading.textContent ?? "";
    (heading as HTMLElement).id = assignSlug(text, used);
  });
}
