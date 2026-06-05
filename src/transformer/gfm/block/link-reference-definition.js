/**
 * 块级语法：链接引用定义 (Link Reference Definitions)
 */
import { BaseBlockParser } from "@/transformer/core/ParserBase.js";

export function normalizeRefLabel(label) {
  return label.replace(/\\(.)/g, "$1").toLowerCase().replace(/\s+/g, " ").trim();
}

export function lookupLinkReference(store, refId) {
  const references = store.get("references") ?? {};
  return references[normalizeRefLabel(refId)] ?? null;
}

const DEF_LINE_RE =
  /^[ \t]*\[((?:\\.|[^\[\]])+)\]:[ \t]*(\S+)(?:[ \t]+(.+))?[ \t]*$/;

function parseTitle(raw) {
  if (!raw) return "";
  const trimmed = raw.trim();
  const quoted = trimmed.match(/^"(.*)"$|^'(.*)'$|^\((.*)\)$/s);
  if (quoted) {
    return (quoted[1] ?? quoted[2] ?? quoted[3] ?? "").replace(/\\(.)/g, "$1");
  }
  return trimmed.replace(/\\(.)/g, "$1");
}

function parseHref(raw) {
  const text = raw.trim();
  if (text.startsWith("<") && text.endsWith(">")) {
    return text.slice(1, -1).replace(/\\(.)/g, "$1");
  }
  return text.replace(/\\(.)/g, "$1");
}

function parseDefinitionAt(lines, index) {
  const line = lines[index] ?? "";
  const match = line.match(DEF_LINE_RE);
  if (!match) return null;

  const id = normalizeRefLabel(match[1]);
  const href = parseHref(match[2]);
  let title = parseTitle(match[3] || "");
  let nextIndex = index + 1;

  if (!title && nextIndex < lines.length) {
    const nextLine = lines[nextIndex] ?? "";
    const titleMatch = nextLine.match(/^[ \t]+(\S.*)[ \t]*$/);
    if (titleMatch) {
      const candidate = titleMatch[1].trim();
      if (candidate && !candidate.startsWith("[") && !/^#{1,6}\s/.test(candidate)) {
        title = parseTitle(candidate);
        nextIndex += 1;
      }
    }
  }

  return { id, href, title, nextIndex };
}

class LinkReferenceDefinitionParser extends BaseBlockParser {
  constructor() {
    super({ type: "linkReferenceDef", priority: 190 });
  }

  parse(lines, index, ctx) {
    const def = parseDefinitionAt(lines, index);
    if (!def) return null;

    const references = ctx.store.get("references") ?? {};
    references[def.id] = { href: def.href, title: def.title };
    ctx.store.set("references", references);

    return { node: null, nextIndex: def.nextIndex };
  }

  render() {
    return "";
  }
}

export default new LinkReferenceDefinitionParser();
