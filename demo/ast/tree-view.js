/**
 * 扁平化 AST 树视图：单行一节点，缩进 + 连线，便于浏览深层结构。
 */

const TYPE_COLORS = {
  root: "#38bdf8",
  paragraph: "#94a3b8",
  heading: "#f472b6",
  text: "#a3e635",
  strong: "#fb923c",
  emphasis: "#fbbf24",
  link: "#60a5fa",
  image: "#34d399",
  code: "#c4b5fd",
  code_block: "#a78bfa",
  blockquote: "#94a3b8",
  list: "#2dd4bf",
  list_item: "#5eead4",
  hr: "#64748b",
  break: "#64748b",
  strikethrough: "#f87171",
  html: "#e879f9",
};

const SKIP_KEYS = new Set(["children", "value", "type"]);

function preview(text, max = 48) {
  const oneLine = String(text).replace(/\r\n/g, "\n").replace(/\n/g, "↵");
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max)}…`;
}

function extraProps(node) {
  const rows = [];
  const raw = node.props ?? {};

  for (const [key, value] of Object.entries(raw)) {
    if (SKIP_KEYS.has(key) || value === undefined) continue;
    rows.push([key, value]);
  }

  if (node.length !== undefined && raw.length === undefined) {
    rows.push(["length", node.length]);
  }

  return rows;
}

function nodeLabel(node) {
  const { type } = node;

  if (type === "text" && node.value !== undefined) {
    return `"${preview(node.value)}"`;
  }

  const parts = [];
  const props = extraProps(node);

  for (const [key, value] of props) {
    if (typeof value === "string") {
      parts.push(`${key}="${preview(value, 32)}"`);
    } else if (typeof value === "number" || typeof value === "boolean") {
      parts.push(`${key}=${value}`);
    } else {
      try {
        parts.push(`${key}=${preview(JSON.stringify(value), 24)}`);
      } catch {
        parts.push(`${key}=…`);
      }
    }
  }

  return parts.join(" ");
}

function countNodes(node) {
  let n = 1;
  let depth = 0;
  let maxDepth = 0;

  function walk(nd, d) {
    maxDepth = Math.max(maxDepth, d);
    const kids = nd.children;
    if (!Array.isArray(kids)) return;
    for (const child of kids) {
      n += 1;
      walk(child, d + 1);
    }
  }

  walk(node, 0);
  depth = maxDepth;
  return { count: n, depth };
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

  /** @param {boolean} collapse - true 表示加入 collapsed */
  _collectPaths(node, path, collapse, depth = 0, maxDepth = Infinity) {
    const kids = node.children;
    if (!Array.isArray(kids) || kids.length === 0) return;

    const shouldCollapse = collapse
      ? true
      : depth >= maxDepth;

    if (shouldCollapse) {
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

  *_visibleRows(node, path = "0", depth = 0) {
    if (!this._matchesFilter(node)) return;

    const kids = Array.isArray(node.children) ? node.children : [];
    const hasKids = kids.length > 0;
    const collapsed = this.collapsed.has(path);
    const type = node.type || "unknown";

    yield {
      path,
      depth,
      type,
      label: nodeLabel(node),
      childCount: kids.length,
      hasKids,
      collapsed,
      node,
    };

    if (!hasKids || collapsed) return;

    for (let i = 0; i < kids.length; i += 1) {
      yield* this._visibleRows(kids[i], `${path}.${i}`, depth + 1);
    }
  }

  _render() {
    const ast = this.ast;
    this.container.replaceChildren();

    if (!ast) {
      this.container.innerHTML = '<div class="ast-empty">暂无 AST</div>';
      return;
    }

    const stats = countNodes(ast);
    const frag = document.createDocumentFragment();

    const statsEl = document.createElement("div");
    statsEl.className = "ast-stats";
    statsEl.textContent = `${stats.count} 个节点 · 最大深度 ${stats.depth}`;
    frag.append(statsEl);

    const list = document.createElement("div");
    list.className = "ast-rows";
    list.setAttribute("role", "tree");

    for (const row of this._visibleRows(ast)) {
      list.appendChild(this._createRow(row));
    }

    if (list.childElementCount === 0) {
      list.innerHTML = '<div class="ast-empty">无匹配节点</div>';
    }

    frag.append(list);
    this.container.append(frag);
  }

  _createRow({ path, depth, type, label, childCount, hasKids, collapsed, node }) {
    const row = document.createElement("div");
    row.className = "ast-row";
    row.dataset.path = path;
    row.setAttribute("role", "treeitem");
    row.style.setProperty("--depth", String(depth));

    if (path === this.selectedPath) {
      row.classList.add("selected");
    }

    const guides = document.createElement("span");
    guides.className = "ast-guides";
    guides.setAttribute("aria-hidden", "true");
    for (let i = 0; i < depth; i += 1) {
      const g = document.createElement("span");
      g.className = "ast-guide";
      guides.append(g);
    }
    row.append(guides);

    if (hasKids) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ast-toggle";
      btn.dataset.action = "toggle";
      btn.setAttribute("aria-label", collapsed ? "展开" : "折叠");
      btn.textContent = collapsed ? "▸" : "▾";
      row.append(btn);
    } else {
      const leaf = document.createElement("span");
      leaf.className = "ast-leaf";
      leaf.textContent = "·";
      row.append(leaf);
    }

    const typeEl = document.createElement("span");
    typeEl.className = "ast-type";
    typeEl.textContent = type;
    typeEl.style.color = TYPE_COLORS[type] ?? "#e2e8f0";
    row.append(typeEl);

    if (label) {
      const labelEl = document.createElement("span");
      labelEl.className = "ast-label";
      labelEl.textContent = label;
      row.append(labelEl);
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
      const extras = extraProps(node);
      for (const [k, v] of extras) clone[k] = v;
      return JSON.stringify(clone, null, 2);
    } catch {
      return node.type;
    }
  }

  destroy() {
    this.container.removeEventListener("click", this._onClick);
  }
}
