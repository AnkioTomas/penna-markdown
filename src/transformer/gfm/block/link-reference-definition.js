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

const LABEL_LINE_RE = /^[ \t]{0,3}\[((?:\\.|[^\[\]])+)\]:[ \t]*(.*)$/;

function unescape(text) {
  return text.replace(/\\(.)/g, "$1");
}

function parseHref(raw) {
  const text = raw.trim();
  if (text.startsWith("<") && text.endsWith(">")) {
    return unescape(text.slice(1, -1));
  }
  return unescape(text);
}

function skipWhitespace(src, i) {
  while (i < src.length && /[ \t]/.test(src[i])) i++;
  if (i < src.length && src[i] === "\n") {
    i++;
    while (i < src.length && /[ \t]/.test(src[i])) i++;
  }
  return i;
}

function parseDestination(src, i) {
  i = skipWhitespace(src, i);
  if (i >= src.length) return null;

  if (src[i] === "<") {
    let j = i + 1;
    while (j < src.length) {
      if (src[j] === "\\") {
        j += 2;
        continue;
      }
      if (src[j] === ">") {
        return { href: src.slice(i + 1, j), next: j + 1 };
      }
      if (src[j] === "\n") return null;
      j++;
    }
    return null;
  }

  let j = i;
  while (j < src.length && !/[ \t\n\r]/.test(src[j])) {
    if (src[j] === "\\") j += 2;
    else j++;
  }
  if (j === i) return null;
  return { href: src.slice(i, j), next: j };
}

function parseTitle(src, i) {
  i = skipWhitespace(src, i);
  if (i >= src.length) return { title: "", next: i };

  const opener = src[i];
  if (opener === '"' || opener === "'" || opener === "(") {
    const closer = opener === "(" ? ")" : opener;
    let j = i + 1;
    let title = "";

    while (j < src.length) {
      if (src[j] === "\\") {
        if (j + 1 < src.length) title += src[j + 1];
        j += 2;
        continue;
      }
      if (src[j] === closer) {
        return { title, next: j + 1 };
      }
      title += src[j];
      j++;
    }

    return null;
  }

  let j = i;
  let title = "";
  while (j < src.length && src[j] !== "\n") {
    title += src[j];
    j++;
  }

  return { title: title.trim(), next: j };
}

function parseDefinitionBody(body) {
  let i = 0;
  while (i < body.length && /[ \t\r\n]/.test(body[i])) i++;

  const dest = parseDestination(body, i);
  if (!dest) return null;
  i = dest.next;

  i = skipWhitespace(body, i);
  const titleResult = parseTitle(body, i);
  if (titleResult === null) return null;
  i = titleResult.next;

  while (i < body.length && /[ \t\r\n]/.test(body[i])) i++;
  if (i < body.length) return null;

  return { href: parseHref(dest.href), title: unescape(titleResult.title) };
}

export function parseDefinitionAt(lines, index) {
  const line = lines[index] ?? "";
  const match = line.match(LABEL_LINE_RE);
  if (!match) return null;

  const id = normalizeRefLabel(match[1]);
  const chunks = [match[2]];
  let end = index + 1;

  while (end < lines.length && lines[end].trim() !== "") {
    if (/^[ \t]{0,3}\[/.test(lines[end])) break;
    const cont = lines[end].match(/^[ \t]{0,3}(.*)$/);
    if (!cont) break;
    chunks.push(cont[1]);
    end++;
  }

  const body = chunks.join("\n");
  const parsed = parseDefinitionBody(body);
  if (!parsed) return null;

  return { id, href: parsed.href, title: parsed.title, nextIndex: end };
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
