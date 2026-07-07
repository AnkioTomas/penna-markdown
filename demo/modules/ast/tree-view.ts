/**
 * 扁平化 AST 树视图：缩进导轨 + 类型胶囊 + 属性标签。
 */
import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";

const SKIP_KEYS = new Set(["children", "value", "type", "length", "props"]);

const CHEVRON_SVG = `<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M6 4l4 4-4 4V4z"/></svg>`;

interface AstChip {
  key: string;
  value: string;
}

interface AstNodeMeta {
  value?: string;
  chips: AstChip[];
}

interface AstRowState {
  path: string;
  depth: number;
  guides: boolean[];
  isLast: boolean;
  type: string;
  meta: AstNodeMeta;
  childCount: number;
  hasKids: boolean;
  collapsed: boolean;
  node: MarkdownNode;
}

export interface AstTreeViewOptions {
  onSelect?: (node: MarkdownNode, path: string) => void;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function preview(text: string, max = 48): string {
  const oneLine = text.replace(/\r\n/g, "\n").replace(/\n/g, "↵");
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max)}…`;
}

function formatChipValue(value: unknown): string {
  if (typeof value === "string") return preview(value, 36);
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  try {
    return preview(JSON.stringify(value), 28);
  } catch {
    return "…";
  }
}

function summarizePropValue(key: string, value: unknown): unknown {
  if (key === "store") return "[ParserStore]";
  return value;
}

function collectMetaFields(
  node: MarkdownNode,
): { key: string; value: unknown }[] {
  const rows: { key: string; value: unknown }[] = [];

  if (node.length !== undefined) {
    rows.push({ key: "length", value: node.length });
  }

  const props = node.props;
  if (props && typeof props === "object") {
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined) continue;
      rows.push({ key: `props.${key}`, value: summarizePropValue(key, value) });
    }
  }

  for (const [key, value] of Object.entries(node)) {
    if (SKIP_KEYS.has(key) || value === undefined) continue;
    rows.push({ key, value });
  }

  return rows;
}

function nodeMeta(node: MarkdownNode): AstNodeMeta {
  const chips = collectMetaFields(node).map(({ key, value }) => ({
    key,
    value: formatChipValue(value),
  }));

  if (node.value !== undefined) {
    return { value: preview(String(node.value), 64), chips };
  }

  return { chips };
}

function countNodes(node: MarkdownNode): { count: number; depth: number } {
  let count = 1;
  let maxDepth = 0;

  function walk(nd: MarkdownNode, d: number): void {
    maxDepth = Math.max(maxDepth, d);
    const kids = nd.children;
    if (!Array.isArray(kids)) return;
    for (const child of kids) {
      count += 1;
      walk(child, d + 1);
    }
  }

  walk(node, 0);
  return { count, depth: maxDepth };
}

export class AstTreeView {
  private readonly container: HTMLElement;
  private readonly onSelect: (node: MarkdownNode, path: string) => void;
  private ast: MarkdownNode | null = null;
  private readonly collapsed = new Set<string>();
  private selectedPath = "0";
  private filter = "";
  private readonly _onClick: (e: MouseEvent) => void;

  constructor(container: HTMLElement, options: AstTreeViewOptions = {}) {
    this.container = container;
    this.onSelect = options.onSelect ?? ((_node, _path) => {});
    this._onClick = this.handleClick.bind(this);
    container.addEventListener("click", this._onClick);
  }

  setAst(ast: MarkdownNode, maxDepth = 2): void {
    this.ast = ast;
    this.collapsed.clear();
    this.selectedPath = "0";
    this.collectPaths(ast, "0", false, 0, maxDepth);
    this.render();
  }

  setFilter(text: string): void {
    this.filter = text.trim().toLowerCase();
    this.render();
  }

  expandAll(): void {
    this.collapsed.clear();
    this.render();
  }

  collapseAll(): void {
    this.collapsed.clear();
    if (!this.ast) return;
    this.collectPaths(this.ast, "0", true);
    this.render();
  }

  expandToDepth(maxDepth: number): void {
    this.collapsed.clear();
    if (!this.ast) return;
    this.collectPaths(this.ast, "0", false, 0, maxDepth);
    this.render();
  }

  hasAst(): boolean {
    return this.ast !== null;
  }

  destroy(): void {
    this.container.removeEventListener("click", this._onClick);
  }

  private collectPaths(
    node: MarkdownNode,
    path: string,
    collapse: boolean,
    depth = 0,
    maxDepth = Infinity,
  ): void {
    const kids = node.children;
    if (!Array.isArray(kids) || kids.length === 0) return;

    if (collapse ? true : depth >= maxDepth) {
      this.collapsed.add(path);
    }

    kids.forEach((child, i) => {
      this.collectPaths(child, `${path}.${i}`, collapse, depth + 1, maxDepth);
    });
  }

  private handleClick(e: MouseEvent): void {
    const target = e.target;
    if (!(target instanceof Element)) return;

    const row = target.closest<HTMLElement>(".ast-row");
    if (!row?.dataset.path) return;

    const path = row.dataset.path;
    const action = target.closest<HTMLElement>("[data-action]")?.dataset.action;

    if (action === "toggle") {
      if (this.collapsed.has(path)) {
        this.collapsed.delete(path);
      } else {
        this.collapsed.add(path);
      }
      this.render();
      return;
    }

    this.selectedPath = path;
    this.container.querySelectorAll(".ast-row.selected").forEach((el) => {
      el.classList.remove("selected");
    });
    row.classList.add("selected");

    const node = this.nodeAt(path);
    if (node) this.onSelect(node, path);
  }

  private nodeAt(path: string): MarkdownNode | null {
    if (!this.ast) return null;
    const parts = path.split(".").map(Number);
    let cur: MarkdownNode = this.ast;
    for (let i = 1; i < parts.length; i += 1) {
      const kids = cur.children;
      if (!Array.isArray(kids)) return null;
      const next = kids[parts[i]];
      if (!next) return null;
      cur = next;
    }
    return cur;
  }

  private matchesFilter(node: MarkdownNode): boolean {
    if (!this.filter) return true;

    const type = (node.type || "").toLowerCase();
    if (type.includes(this.filter)) return true;

    const kids = node.children;
    if (!Array.isArray(kids)) return false;
    return kids.some((child) => this.matchesFilter(child));
  }

  private *visibleRows(
    node: MarkdownNode,
    path = "0",
    depth = 0,
    guides: boolean[] = [],
    isLast = true,
  ): Generator<AstRowState> {
    if (!this.matchesFilter(node)) return;

    const kids = Array.isArray(node.children) ? node.children : [];
    const hasKids = kids.length > 0;
    const collapsed = this.collapsed.has(path);
    const type = node.type || "unknown";

    yield {
      path,
      depth,
      guides,
      isLast,
      type,
      meta: nodeMeta(node),
      childCount: kids.length,
      hasKids,
      collapsed,
      node,
    };

    if (!hasKids || collapsed) return;

    for (let i = 0; i < kids.length; i += 1) {
      yield* this.visibleRows(
        kids[i],
        `${path}.${i}`,
        depth + 1,
        [...guides, !isLast],
        i === kids.length - 1,
      );
    }
  }

  private render(): void {
    const ast = this.ast;
    this.container.replaceChildren();

    if (!ast) {
      this.container.innerHTML =
        '<div class="ast-empty"><span class="ast-empty-icon">◇</span>暂无 AST</div>';
      return;
    }

    const stats = countNodes(ast);
    const frag = document.createDocumentFragment();

    const statsEl = document.createElement("div");
    statsEl.className = "ast-stats";
    statsEl.innerHTML = `
      <span class="stat-pill"><span class="stat-label">节点</span><span class="stat-value">${stats.count}</span></span>
      <span class="stat-pill"><span class="stat-label">深度</span><span class="stat-value">${stats.depth}</span></span>
    `;
    frag.append(statsEl);

    const list = document.createElement("div");
    list.className = "ast-rows";
    list.setAttribute("role", "tree");

    for (const row of this.visibleRows(ast)) {
      list.appendChild(this.createRow(row));
    }

    if (list.childElementCount === 0) {
      list.innerHTML =
        '<div class="ast-empty"><span class="ast-empty-icon">◇</span>无匹配节点</div>';
    }

    frag.append(list);
    this.container.append(frag);
  }

  private createIndent(
    guides: boolean[],
    isLast: boolean,
    depth: number,
  ): HTMLElement {
    const indent = document.createElement("div");
    indent.className = "ast-indent";
    indent.setAttribute("aria-hidden", "true");

    if (depth === 0) return indent;

    for (let i = 0; i < guides.length; i += 1) {
      const rail = document.createElement("span");
      rail.className = guides[i] ? "ast-rail continue" : "ast-rail";
      indent.append(rail);
    }

    const branch = document.createElement("span");
    branch.className = isLast ? "ast-branch last" : "ast-branch";
    indent.append(branch);

    return indent;
  }

  private createRow(state: AstRowState): HTMLElement {
    const {
      path,
      depth,
      guides,
      isLast,
      type,
      meta,
      childCount,
      hasKids,
      collapsed,
      node,
    } = state;

    const row = document.createElement("div");
    row.className = "ast-row";
    row.dataset.path = path;
    row.dataset.type = type;
    row.dataset.depth = String(depth);
    row.setAttribute("role", "treeitem");

    if (path === this.selectedPath) {
      row.classList.add("selected");
    }

    row.append(this.createIndent(guides, isLast, depth));

    if (hasKids) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ast-toggle";
      btn.dataset.action = "toggle";
      btn.setAttribute("aria-label", collapsed ? "展开" : "折叠");
      if (collapsed) btn.classList.add("collapsed");
      btn.innerHTML = CHEVRON_SVG;
      row.append(btn);
    } else {
      const dot = document.createElement("span");
      dot.className = "ast-dot";
      row.append(dot);
    }

    const typeEl = document.createElement("span");
    typeEl.className = "ast-type";
    typeEl.textContent = type;
    row.append(typeEl);

    const body = document.createElement("div");
    body.className = "ast-body";

    if (meta.value !== undefined) {
      const val = document.createElement("span");
      val.className = "ast-value";
      val.textContent = meta.value;
      body.append(val);
    }

    for (const chip of meta.chips) {
      const el = document.createElement("span");
      el.className = "ast-chip";
      if (chip.key === "length") el.dataset.field = "length";
      else if (chip.key.startsWith("props.")) el.dataset.field = "props";
      el.innerHTML = `<span class="chip-key">${escapeHtml(chip.key)}</span><span class="chip-val">${escapeHtml(chip.value)}</span>`;
      body.append(el);
    }

    if (body.childElementCount > 0) {
      row.append(body);
    }

    if (hasKids) {
      const badge = document.createElement("span");
      badge.className = "ast-badge";
      badge.textContent = String(childCount);
      badge.title = `${childCount} 个子节点`;
      row.append(badge);
    }

    row.title = this.tooltip(node);
    return row;
  }

  private tooltip(node: MarkdownNode): string {
    try {
      const clone: Record<string, unknown> = {
        type: node.type,
        length: node.length,
      };
      if (node.value !== undefined) clone.value = node.value;
      if (node.props && Object.keys(node.props).length > 0) {
        clone.props = Object.fromEntries(
          Object.entries(node.props).map(([key, value]) => [
            key,
            summarizePropValue(key, value),
          ]),
        );
      }
      if (node.children) clone.children = `[${node.children.length}]`;
      return JSON.stringify(clone, null, 2);
    } catch {
      return node.type;
    }
  }
}
