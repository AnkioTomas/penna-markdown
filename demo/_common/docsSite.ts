import { fetchDirListing } from "./api.js";

export const SIDEBAR_FILE = "_sidebar.md";
export const INDEX_FILES = ["_index.md", "index.md"] as const;

export interface DocTreeFile {
  kind: "file";
  name: string;
  href: string;
}

export interface DocTreeDir {
  kind: "dir";
  name: string;
  /** 目录 URL（以 `/` 结尾）或索引页 href */
  href: string;
  indexHref?: string;
  children: DocTreeNode[];
}

export type DocTreeNode = DocTreeFile | DocTreeDir;

export interface SidebarItem {
  title: string;
  link: string;
}

export interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

const LINK_RE = /^\s*-\s*\[([^\]]+)\]\(([^)]+)\)\s*$/;
const GROUP_RE = /^#{2,3}\s+(.+)$/;

export function isDocsMetaFile(name: string): boolean {
  const base = name.split("/").pop() ?? name;
  return base === SIDEBAR_FILE || base === "_index.md";
}

export function normalizeDocHref(href: string): string {
  try {
    const url = new URL(href, window.location.origin);
    let path = decodeURIComponent(url.pathname);
    if (path.endsWith("/")) return path;
    if (!path.endsWith(".md")) path = `${path}.md`;
    return path;
  } catch {
    return href;
  }
}

export function dirHref(dir: string): string {
  const base = dir.endsWith("/") ? dir : `${dir}/`;
  return base.startsWith("/") ? base : `/${base}`;
}

export function resolveLinkFromDir(dir: string, link: string): string {
  const base = dir.endsWith("/") ? dir : `${dir}/`;
  const url = new URL(link, new URL(base, window.location.origin));
  return decodeURIComponent(url.pathname);
}

/** 解析 `_sidebar.md`：支持 `## 分组` + `- [标题](path)` */
export function parseSidebarMarkdown(content: string): SidebarGroup[] {
  const groups: SidebarGroup[] = [];
  let current: SidebarGroup = { title: "", items: [] };

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("<!--")) continue;

    const groupMatch = trimmed.match(GROUP_RE);
    if (groupMatch) {
      if (current.items.length > 0 || current.title) groups.push(current);
      current = { title: groupMatch[1].trim(), items: [] };
      continue;
    }

    const linkMatch = trimmed.match(LINK_RE);
    if (linkMatch) {
      current.items.push({ title: linkMatch[1], link: linkMatch[2].trim() });
    }
  }

  if (current.items.length > 0 || current.title) groups.push(current);
  return groups.filter((g) => g.items.length > 0);
}

function indexCandidates(dir: string): string[] {
  const base = dirHref(dir);
  return INDEX_FILES.map((name) => `${base}${name}`);
}

export async function findExistingDoc(href: string): Promise<string | null> {
  const candidates = href.endsWith("/")
    ? indexCandidates(href)
    : [normalizeDocHref(href)];

  for (const candidate of candidates) {
    try {
      const head = await fetch(candidate, { method: "HEAD" });
      if (head.ok) return candidate;
      const get = await fetch(candidate);
      if (get.ok) return candidate;
    } catch {
      /* try next */
    }
  }
  return null;
}

export async function resolveDirIndexHref(dir: string): Promise<string | null> {
  return findExistingDoc(dirHref(dir));
}

async function tryFetchSidebar(dir: string): Promise<string | null> {
  const href = `${dirHref(dir)}${SIDEBAR_FILE}`;
  try {
    const res = await fetch(href);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function autoScanDir(dir: string): Promise<DocTreeNode[]> {
  const list = await fetchDirListing(dir);
  const nodes: DocTreeNode[] = [];

  const dirs = list.filter((f) => f.isDir).sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
  const files = list
    .filter((f) => !f.isDir && f.name.endsWith(".md") && !isDocsMetaFile(f.name))
    .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));

  for (const file of files) {
    nodes.push({
      kind: "file",
      name: file.name.replace(/\.md$/i, ""),
      href: file.href,
    });
  }

  for (const sub of dirs) {
    const children = await buildDocTree(sub.href);
    if (children.length === 0) continue;
    const indexHref = (await resolveDirIndexHref(sub.href)) ?? undefined;
    nodes.push({
      kind: "dir",
      name: sub.name,
      href: sub.href,
      indexHref,
      children,
    });
  }

  return nodes;
}

async function itemToNode(dir: string, item: SidebarItem): Promise<DocTreeNode | null> {
  const resolved = resolveLinkFromDir(dir, item.link);
  const isDirLink = item.link.endsWith("/") || resolved.endsWith("/");

  if (isDirLink) {
    const directory = resolved.endsWith("/") ? resolved : `${resolved}/`;
    const indexHref = (await resolveDirIndexHref(directory)) ?? undefined;
    const subSidebar = await tryFetchSidebar(directory);

    if (subSidebar) {
      const subGroups = parseSidebarMarkdown(subSidebar);
      const children: DocTreeNode[] = [];
      for (const subGroup of subGroups) {
        for (const entry of subGroup.items) {
          const child = await itemToNode(directory, entry);
          if (child) children.push(child);
        }
      }
      if (children.length === 0 && !indexHref) return null;
      return {
        kind: "dir",
        name: item.title,
        href: directory,
        indexHref,
        children,
      };
    }

    const children = await autoScanDir(directory);
    if (children.length === 0 && !indexHref) return null;
    return {
      kind: "dir",
      name: item.title,
      href: directory,
      indexHref,
      children,
    };
  }

  const href = await findExistingDoc(resolved);
  if (!href) return null;
  return { kind: "file", name: item.title, href };
}

/** 目录链接若存在子级 `_sidebar.md`，则展开为多个节点（避免重复嵌套） */
async function itemToNodes(dir: string, item: SidebarItem): Promise<DocTreeNode[]> {
  const resolved = resolveLinkFromDir(dir, item.link);
  if (!item.link.endsWith("/") && !resolved.endsWith("/")) {
    const node = await itemToNode(dir, item);
    return node ? [node] : [];
  }

  const directory = resolved.endsWith("/") ? resolved : `${resolved}/`;
  const subSidebar = await tryFetchSidebar(directory);
  if (subSidebar) {
    const subGroups = parseSidebarMarkdown(subSidebar);
    const nodes: DocTreeNode[] = [];
    for (const subGroup of subGroups) {
      for (const entry of subGroup.items) {
        const child = await itemToNode(directory, entry);
        if (child) nodes.push(child);
      }
    }
    return nodes;
  }

  const node = await itemToNode(dir, item);
  return node ? [node] : [];
}

async function buildFromSidebarConfig(dir: string, content: string): Promise<DocTreeNode[]> {
  const groups = parseSidebarMarkdown(content);
  const nodes: DocTreeNode[] = [];

  for (const group of groups) {
    const items: DocTreeNode[] = [];
    for (const entry of group.items) {
      items.push(...(await itemToNodes(dir, entry)));
    }
    if (items.length === 0) continue;

    if (group.title) {
      nodes.push({
        kind: "dir",
        name: group.title,
        href: dirHref(dir),
        children: items,
      });
    } else {
      nodes.push(...items);
    }
  }

  return nodes;
}

/** 构建文档侧栏树：优先 `_sidebar.md`，否则自动扫描目录 */
export async function buildDocTree(dir = "/docs/"): Promise<DocTreeNode[]> {
  const sidebar = await tryFetchSidebar(dir);
  if (sidebar) return buildFromSidebarConfig(dir, sidebar);
  return autoScanDir(dir);
}

export async function resolveDocsEntryHref(dir = "/docs/"): Promise<string | null> {
  return resolveDirIndexHref(dir);
}

/** 将 Markdown 内相对链接解析为 docs 站点内的文档 href */
export function resolveDocLink(fromHref: string, rawLink: string): string | null {
  if (!rawLink || rawLink.startsWith("#")) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(rawLink)) return null;

  try {
    const base = new URL(fromHref, window.location.origin);
    const target = new URL(rawLink, base);
    const path = decodeURIComponent(target.pathname);

    if (path.endsWith("/")) return path;
    if (path.endsWith(".md")) return path;
    return `${path}.md`;
  } catch {
    return null;
  }
}

export function flattenDocTree(nodes: DocTreeNode[]): DocTreeFile[] {
  const out: DocTreeFile[] = [];
  for (const node of nodes) {
    if (node.kind === "file") out.push(node);
    else out.push(...flattenDocTree(node.children));
  }
  return out;
}

export function collectNavHrefs(nodes: DocTreeNode[]): Set<string> {
  const set = new Set<string>();
  const walk = (list: DocTreeNode[]) => {
    for (const node of list) {
      if (node.kind === "file") set.add(normalizeDocHref(node.href));
      else {
        if (node.indexHref) set.add(normalizeDocHref(node.indexHref));
        walk(node.children);
      }
    }
  };
  walk(nodes);
  return set;
}

export function findDocFile(nodes: DocTreeNode[], href: string): DocTreeFile | null {
  const target = normalizeDocHref(href);
  for (const node of nodes) {
    if (node.kind === "file" && normalizeDocHref(node.href) === target) return node;
    if (node.kind === "dir") {
      if (node.indexHref && normalizeDocHref(node.indexHref) === target) {
        return { kind: "file", name: node.name, href: node.indexHref };
      }
      const found = findDocFile(node.children, href);
      if (found) return found;
    }
  }
  return null;
}

export async function loadDocHref(href: string): Promise<string | null> {
  if (href.endsWith("/")) return resolveDirIndexHref(href);
  return findExistingDoc(href);
}
