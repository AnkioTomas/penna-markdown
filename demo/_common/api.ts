import type { PennaFileItem } from "@/editor/sidebar/SideBarOptions.js";

export interface DocFile {
  name: string;
  isDir: boolean;
  href: string;
  mtime?: number;
  size?: number;
}

/**
 * dist-demo 站点根（同时含 demo/、docs/、logo/ 的那一层）。
 * 用当前 URL 里的 `/demo/` 定位，避免绝对路径在子目录部署时打到错误根。
 */
export function getDemoSiteRoot(): URL {
  const { pathname, origin } = window.location;
  const normalized = pathname.replace(/\\/g, "/");

  const demoDir = normalized.indexOf("/demo/");
  if (demoDir >= 0) {
    return new URL(normalized.slice(0, demoDir + 1), origin);
  }

  if (/\/demo\/index\.html$/i.test(normalized)) {
    return new URL(normalized.replace(/demo\/index\.html$/i, ""), origin);
  }

  if (/\/demo$/i.test(normalized)) {
    return new URL(`${normalized.replace(/demo$/i, "")}`, origin);
  }

  if (/\/index\.html$/i.test(normalized)) {
    return new URL(normalized.replace(/index\.html$/i, ""), origin);
  }

  return new URL(
    normalized.endsWith("/") ? normalized : normalized.replace(/[^/]+$/, ""),
    origin,
  );
}

/** 把站点根相对路径（如 `/docs/a.md`）解析成可 fetch 的绝对 URL */
export function siteUrl(pathFromRoot: string): string {
  const rel = pathFromRoot.replace(/^\/+/, "");
  return new URL(rel, getDemoSiteRoot()).toString();
}

/** 通过静态 listing 或 Vite 目录索引 API（`?json`）拉取文件列表 */
export async function fetchDirListing(dir: string): Promise<DocFile[]> {
  const base = dir.endsWith("/") ? dir : `${dir}/`;
  const listingUrl = siteUrl(`${base}__listing__.json`);

  const staticRes = await fetch(listingUrl);
  if (staticRes.ok) {
    return (await staticRes.json()) as DocFile[];
  }

  // 开发态：Vite middleware 仍挂在站点根绝对路径上
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
    const url = href.startsWith("http") ? href : siteUrl(href);
    const res = await fetch(url);
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
export async function fetchMarkdownFileItems(
  dir = "/docs/",
): Promise<PennaFileItem[]> {
  const docs = await fetchDocsList(dir);
  const items = await Promise.all(
    docs.map(async (doc) => {
      const content = await fetchDocContent(doc.href);
      return {
        id: doc.href,
        title: displayTitle(doc.name),
        updateTime: formatFileTime(doc.mtime),
        summary: extractMarkdownSummary(content) || displayTitle(doc.name),
      } satisfies PennaFileItem;
    }),
  );
  return items.sort((a, b) => {
    const docA = docs.find((d) => d.href === a.id);
    const docB = docs.find((d) => d.href === b.id);
    return (docB?.mtime ?? 0) - (docA?.mtime ?? 0);
  });
}

export type { DocTreeFile, DocTreeNode } from "./docsSite.js";
export {
  buildDocTree,
  buildDocTree as fetchMarkdownTree,
  collectNavHrefs,
  findDocFile,
  flattenDocTree,
  loadDocHref,
  normalizeDocHref,
  parseSidebarMarkdown,
  resolveDocLink,
  resolveDocsEntryHref,
} from "./docsSite.js";
