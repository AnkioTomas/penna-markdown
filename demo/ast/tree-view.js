/**
 * 扁平化 AST 树视图：缩进导轨 + 类型胶囊 + 属性标签。
 */

const SKIP_KEYS = new Set(["children", "value", "type"]);

const CHEVRON_SVG = `<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M6 4l4 4-4 4V4z"/></svg>`;

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function preview(text, max = 48) {
  const oneLine = String(text).replace(/\r\n/g, "\n").replace(/\n/g, "↵");
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max)}…`;
}

function formatChipValue(value) {
  if (typeof value === "string") return preview(value, 36);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return preview(JSON.stringify(value), 28);
  } catch {
    return "…";
  }
}

function extraProps(node) {
  const rows = [];
  const raw = node.props ?? {};

  for (const [key, value] of Object.entries(raw)) {
    if (SKIP_KEYS.has(key) || value === undefined) continue;
    rows.push({ key, value });
  }

  if (node.length !== undefined && raw.length === undefined) {
    rows.push({ key: "length", value: node.length });
  }

  return rows;
}

/** @returns {{ value?: string, chips: { key: string, value: string }[] }} */
function nodeMeta(node) {
  const { type } = node;

  if (type === "text" && node.value !== undefined) {
    return { value: preview(node.value, 64), chips: [] };
  }

  return {
    chips: extraProps(node).map(({ key, value }) => ({
      key,
      value: formatChipValue(value),
    })),
  };
}

function countNodes(node) {
  let count = 1;
  let maxDepth = 0;

  function walk(nd, d) {
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
  /**
   * @param {HTMLElement} container
   * @param {{ onSelect?: (node: object, path: string) => void }} [options]
   */
  constructor(container, options = {}) {
    this.container = container;
    this.onSelect = options.onSelect ?? (() => {});
    this.ast = null;
    this.collapsed = new Set();
    this.selectedPath = "0";
    this.filter = "";

    this._onClick = this._onClick.bind(this);
    container.addEventListener("click", this._onClick);
  }

  setAst(ast) {
    this.ast = ast;
    this.collapsed.clear();
    this.selectedPath = "0";
    this._collectPaths(ast, "0", false, 0, 2);
    this._render();
  }

  setFilter(text) {
    this.filter = String(text).trim().toLowerCase();
    this._render();
  }

  expandAll() {
    this.collapsed.clear();
    this._render();
  }

  collapseAll() {
    this.collapsed.clear();
    if (!this.ast) return;
    this._collectPaths(this.ast, "0", true);
    this._render();
  }

  expandToDepth(maxDepth) {
    this.collapsed.clear();
    if (!this.ast) return;
    this._collectPaths(this.ast, "0", false, 0, maxDepth);
    this._render();
  }

  _collectPaths(node, path, collapse, depth = 0, maxDepth = Infinity) {
    const kids = node.children;
    if (!Array.isArray(kids) || kids.length === 0) return;

    if (collapse ? true : depth >= maxDepth) {
      this.collapsed.add(path);
    }

    kids.forEach((child, i) => {
      this._collectPaths(child, `${path}.${i}`, collapse, depth + 1, maxDepth);
    });
  }

  _onClick(e) {
    const row = e.target.closest(".ast-row");
    if (!row) return;

    const path = row.dataset.path;
    const action = e.target.closest("[data-action]")?.dataset.action;

    if (action === "toggle") {
      if (this.collapsed.has(path)) {
        this.collapsed.delete(path);
      } else {
        this.collapsed.add(path);
      }
      this._render();
      return;
    }

    this.selectedPath = path;
    this.container.querySelectorAll(".ast-row.selected").forEach((el) => {
      el.classList.remove("selected");
    });
    row.classList.add("selected");

    const node = this._nodeAt(path);
    if (node) this.onSelect(node, path);
  }

  _nodeAt(path) {
    if (!this.ast) return null;
    const parts = path.split(".").map(Number);
    let cur = this.ast;
    for (let i = 1; i < parts.length; i += 1) {
      const kids = cur.children;
      if (!Array.isArray(kids)) return null;
      cur = kids[parts[i]];
      if (!cur) return null;
    }
    return cur;
  }

  _matchesFilter(node) {
    const filter = this.filter;
    if (!filter) return true;

    const type = (node.type || "").toLowerCase();
    if (type.includes(filter)) return true;

    const kids = node.children;
    if (!Array.isArray(kids)) return false;
    return kids.some((child) => this._matchesFilter(child));
  }

  *_visibleRows(node, path = "0", depth = 0, guides = [], isLast = true) {
    if (!this._matchesFilter(node)) return;

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
      yield* this._visibleRows(
        kids[i],
        `${path}.${i}`,
        depth + 1,
        [...guides, !isLast],
        i === kids.length - 1,
      );
    }
  }

  _render() {
    const ast = this.ast;
    this.container.replaceChildren();

    if (!ast) {
      this.container.innerHTML = '<div class="ast-empty"><span class="ast-empty-icon">◇</span>暂无 AST</div>';
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

    for (const row of this._visibleRows(ast)) {
      list.appendChild(this._createRow(row));
    }

    if (list.childElementCount === 0) {
      list.innerHTML = '<div class="ast-empty"><span class="ast-empty-icon">◇</span>无匹配节点</div>';
    }

    frag.append(list);
    this.container.append(frag);
  }

  _createIndent(guides, isLast, depth) {
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

  _createRow({ path, depth, guides, isLast, type, meta, childCount, hasKids, collapsed, node }) {
    const row = document.createElement("div");
    row.className = "ast-row";
    row.dataset.path = path;
    row.dataset.type = type;
    row.dataset.depth = String(depth);
    row.setAttribute("role", "treeitem");

    if (path === this.selectedPath) {
      row.classList.add("selected");
    }

    row.append(this._createIndent(guides, isLast, depth));

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

    row.title = this._tooltip(node);
    return row;
  }

  _tooltip(node) {
    try {
      const clone = { type: node.type };
      if (node.value !== undefined) clone.value = node.value;
      if (node.children) clone.children = `[${node.children.length}]`;
      for (const { key, value } of extraProps(node)) clone[key] = value;
      return JSON.stringify(clone, null, 2);
    } catch {
      return node.type;
    }
  }

  destroy() {
    this.container.removeEventListener("click", this._onClick);
  }
}
