/**
 * 脚注定义解析与收集
 */

/** @param {string[]} lines @param {number} index */
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

function ensureFootnoteStore(store) {
  const doc = store.document();
  if (!doc.footnoteDefinitions) doc.footnoteDefinitions = {};
  return doc;
}

/** @param {string[]} lines @param {import('@/transformer/core/ParserStore.js').ParserStore} store */
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

/** @param {import('@/transformer/core/ParserStore.js').ParserStore} store @param {string} id */
export function lookupFootnoteDefinition(store, id) {
  collectFootnoteDefinitions(store.document().lines, store);
  return store.document().footnoteDefinitions?.[id] ?? null;
}

/** @param {import('@/transformer/core/MarkdownNode.js').MarkdownNode[]} nodes @param {(node: import('@/transformer/core/MarkdownNode.js').MarkdownNode) => void} fn */
export function walkNodes(nodes, fn) {
  for (const node of nodes) {
    fn(node);
    if (node.children?.length) walkNodes(node.children, fn);
  }
}
