import type { CherryFileItem } from "@/editor/sidebar/SideBarOptions.js";

export interface DocFile {
  name: string;
  isDir: boolean;
  href: string;
  mtime?: number;
  size?: number;
}

/** 通过 Vite 目录索引 API（`?json`）拉取文件列表 */
export async function fetchDirListing(dir: string): Promise<DocFile[]> {
  const base = dir.endsWith("/") ? dir : `${dir}/`;
  const res = await fetch(`${base}?json`);
  if (!res.ok) throw new Error(`目录列表加载失败: ${base}`);
  return (await res.json()) as DocFile[];
}

export async function fetchDocsList(dir = "/docs/"): Promise<DocFile[]> {
  try {
    const list = await fetchDirListing(dir);
    return list.filter((f) => !f.isDir && f.name.endsWith(".md"));
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function fetchDocContent(href: string): Promise<string> {
  try {
    const res = await fetch(href);
    if (!res.ok) throw new Error("Failed to fetch doc content");
    return await res.text();
  } catch (e) {
    console.error(e);
    return "加载失败...";
  }
}

function formatFileTime(mtime?: number): string {
  if (!mtime) return "";
  return new Date(mtime).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function displayTitle(name: string): string {
  return name.replace(/\.md$/i, "");
}

/** 跳过 frontmatter，取首段可用文本作摘要 */
export function extractMarkdownSummary(markdown: string, maxLen = 80): string {
  let text = markdown;
  if (text.startsWith("---")) {
    const end = text.indexOf("\n---", 3);
    if (end !== -1) text = text.slice(end + 4);
  }
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    return trimmed.length > maxLen ? `${trimmed.slice(0, maxLen)}…` : trimmed;
  }
  return "";
}

/** 将目录中的 Markdown 文件转为侧栏文件项 */
export async function fetchMarkdownFileItems(dir = "/docs/"): Promise<CherryFileItem[]> {
  const docs = await fetchDocsList(dir);
  const items = await Promise.all(
    docs.map(async (doc) => {
      const content = await fetchDocContent(doc.href);
      return {
        id: doc.href,
        title: displayTitle(doc.name),
        updateTime: formatFileTime(doc.mtime),
        summary: extractMarkdownSummary(content) || displayTitle(doc.name),
      } satisfies CherryFileItem;
    }),
  );
  return items.sort((a, b) => {
    const docA = docs.find((d) => d.href === a.id);
    const docB = docs.find((d) => d.href === b.id);
    return (docB?.mtime ?? 0) - (docA?.mtime ?? 0);
  });
}
