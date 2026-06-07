/**
 * @file 脚注定义解析与收集
 * @module transformer/extends/utils/footnote
 *
 * 解析 GFM 风格脚注定义 `[^id]: body`，在文档级 store 中收集定义，
 * 并提供 AST 遍历辅助函数供脚注扩展使用。
 */

/**
 * @typedef {import('@/transformer/core/ParserStore.js').ParserStore} ParserStore
 */

/**
 * @typedef {import('@/transformer/core/MarkdownNode.js').MarkdownNode} MarkdownNode
 */

/**
 * @typedef {{
 *   id: string,
 *   lines: string[],
 *   nextIndex: number
 * }} FootnoteDefinition
 */

/**
 * 从 lines[index] 起解析一条脚注定义。
 *
 * 支持多行正文（后续非空、非新定义行视为续行），并裁剪首尾空行。
 *
 * @param {string[]} lines
 * @param {number} index
 * @returns {FootnoteDefinition | null} 当前行不匹配脚注定义语法时返回 null
 */
export function parseFootnoteDefinition(lines, index) {
  const line = lines[index] ?? "";
  const match = line.match(/^ {0,3}\[\^([^\]]+)\]:(?:[ \t]|$)(.*)$/);
  if (!match) return null;

  const bodyLines = [];
  if (match[2]?.length) bodyLines.push(match[2]);

  let i = index + 1;
  while (i < lines.length) {
    const ln = lines[i];
    if (ln.trim() === "") break;
    if (/^ {0,3}\[\^[^\]]+\]:(?:\s|$)/.test(ln)) break;
    bodyLines.push(ln);
    i += 1;
  }

  let start = 0;
  let end = bodyLines.length;
  while (start < end && bodyLines[start].trim() === "") start += 1;
  while (end > start && bodyLines[end - 1].trim() === "") end -= 1;

  return {
    id: match[1],
    lines: bodyLines.slice(start, end),
    nextIndex: i,
  };
}

/**
 * 确保文档 store 上存在 footnoteDefinitions 容器。
 *
 * @param {ParserStore} store
 * @returns {Record<string, unknown>} store.document() 返回的文档对象
 */
function ensureFootnoteStore(store) {
  const doc = store.document();
  if (!doc.footnoteDefinitions) doc.footnoteDefinitions = {};
  return doc;
}

/**
 * 扫描全文并收集脚注定义到 store.document().footnoteDefinitions。
 *
 * 同一 id 仅保留首次出现的定义；重复调用时若已收集则直接返回。
 *
 * @param {string[] | null | undefined} lines
 * @param {ParserStore} store
 * @returns {void}
 */
export function collectFootnoteDefinitions(lines, store) {
  const doc = ensureFootnoteStore(store);
  if (doc.footnoteDefinitionsCollected) return;
  if (!lines) return;

  let i = 0;
  while (i < lines.length) {
    const def = parseFootnoteDefinition(lines, i);
    if (def) {
      if (!doc.footnoteDefinitions[def.id]) {
        doc.footnoteDefinitions[def.id] = { lines: def.lines };
      }
      i = def.nextIndex;
      continue;
    }
    i += 1;
  }

  doc.footnoteDefinitionsCollected = true;
}

/**
 * 按 id 查找脚注定义，必要时先触发全文收集。
 *
 * @param {ParserStore} store
 * @param {string} id
 * @returns {{ lines: string[] } | null}
 */
export function lookupFootnoteDefinition(store, id) {
  collectFootnoteDefinitions(store.document().lines, store);
  return store.document().footnoteDefinitions?.[id] ?? null;
}

/**
 * 深度优先遍历 AST 节点树，对每个节点调用 fn。
 *
 * @param {MarkdownNode[]} nodes
 * @param {(node: MarkdownNode) => void} fn
 * @returns {void}
 */
export function walkNodes(nodes, fn) {
  for (const node of nodes) {
    fn(node);
    if (node.children?.length) walkNodes(node.children, fn);
  }
}
