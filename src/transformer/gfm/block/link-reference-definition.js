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

const LABEL_LINE_RE = /^[ \t]{0,3}\[((?:\\.|[^\[\]\n])+)\]:[ \t]*(.*)$/;

function isAsciiPunct(ch) {
  return /[!-/:-@\[-`{-~]/.test(ch);
}

function readEscaped(src, i) {
  if (src[i] !== "\\") return null;
  if (i + 1 >= src.length) return { text: "\\", next: i + 1 };
  const next = src[i + 1];
  if (isAsciiPunct(next)) return { text: next, next: i + 2 };
  return { text: `\\${next}`, next: i + 2 };
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
    let href = "";
    while (j < src.length) {
      const esc = readEscaped(src, j);
      if (esc) {
        href += esc.text;
        j = esc.next;
        continue;
      }
      if (src[j] === ">") {
        return { href, next: j + 1, angle: true };
      }
      if (src[j] === "\n") return null;
      href += src[j];
      j++;
    }
    return null;
  }

  let j = i;
  let href = "";
  while (j < src.length && !/[ \t\n\r]/.test(src[j])) {
    const esc = readEscaped(src, j);
    if (esc) {
      href += esc.text;
      j = esc.next;
      continue;
    }
    href += src[j];
    j++;
  }
  if (!href) return null;
  return { href, next: j, angle: false };
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
      const esc = readEscaped(src, j);
      if (esc) {
        title += esc.text;
        j = esc.next;
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

  return null;
}

function analyzeDefinitionBody(body) {
  let i = 0;
  while (i < body.length && /[ \t\r\n]/.test(body[i])) i++;

  const dest = parseDestination(body, i);
  if (!dest) return { complete: false, parsed: null };

  const afterDest = dest.next;
  let ti = skipWhitespace(body, afterDest);
  if (ti >= body.length) {
    return { complete: true, parsed: { href: dest.href, title: "" } };
  }

  if (ti === afterDest && (body[ti] === '"' || body[ti] === "'" || body[ti] === "(")) {
    return { complete: false, parsed: null };
  }

  const titleResult = parseTitle(body, ti);
  if (titleResult === null) {
    const opener = body[ti];
    if (opener === '"' || opener === "'" || opener === "(") {
      return { complete: false, parsed: null };
    }
    return { complete: false, parsed: null };
  }

  let end = titleResult.next;
  while (end < body.length && /[ \t\r\n]/.test(body[end])) end++;
  if (end < body.length) return { complete: false, parsed: null };

  return { complete: true, parsed: { href: dest.href, title: titleResult.title } };
}

function hasMoreDefinitionLines(lines, end) {
  if (end >= lines.length || lines[end].trim() === "") return false;
  if (/^[ \t]{0,3}\[/.test(lines[end])) return false;
  return true;
}

function findLabelCloseLine(lines, index) {
  if (!/^[ \t]{0,3}\[/.test(lines[index] ?? "")) return null;
  for (let i = index; i < lines.length; i++) {
    if (/\]:[ \t]/.test(lines[i])) return i;
    if (i > index && lines[i].trim() === "") return null;
  }
  return null;
}

export function parseDefinitionAt(lines, index) {
  const line = lines[index] ?? "";

  if (/^[ \t]{0,3}\[/.test(line) && !LABEL_LINE_RE.test(line)) {
    const labelEnd = findLabelCloseLine(lines, index);
    if (labelEnd !== null) {
      const merged = lines.slice(index, labelEnd + 1).join("\n");
      const multi = merged.match(/^[ \t]{0,3}\[([\s\S]*?)\]:[ \t]*(.*)$/);
      if (multi && /\n/.test(multi[1])) {
        return { invalid: true, nextIndex: labelEnd + 1 };
      }
    }
  }

  const match = line.match(LABEL_LINE_RE);
  if (!match) return null;

  const id = normalizeRefLabel(match[1]);
  const chunks = [match[2]];
  let end = index + 1;

  let state = analyzeDefinitionBody(chunks.join("\n"));

  while (true) {
    if (state.complete && state.parsed) {
      if (state.parsed.title) break;
      if (!hasMoreDefinitionLines(lines, end)) break;
      const cont = lines[end].match(/^[ \t]{0,3}(.*)$/);
      if (!cont) break;
      const peek = analyzeDefinitionBody([...chunks, cont[1]].join("\n"));
      if (!peek.complete || !peek.parsed?.title) break;
    }

    if (!hasMoreDefinitionLines(lines, end)) break;
    const cont = lines[end].match(/^[ \t]{0,3}(.*)$/);
    if (!cont) break;
    chunks.push(cont[1]);
    end++;
    state = analyzeDefinitionBody(chunks.join("\n"));
  }

  if (!state.complete || !state.parsed) return null;

  return { id, href: state.parsed.href, title: state.parsed.title, nextIndex: end };
}

class LinkReferenceDefinitionParser extends BaseBlockParser {
  constructor() {
    super({ type: "linkReferenceDef", priority: 190, canInterruptParagraph: false });
  }

  parse(lines, index, ctx) {
    const def = parseDefinitionAt(lines, index);
    if (!def) return null;
    if (def.invalid) return { node: null, nextIndex: def.nextIndex };

    const references = ctx.store.get("references") ?? {};
    if (!references[def.id]) {
      references[def.id] = { href: def.href, title: def.title };
      ctx.store.set("references", references);
    }

    return { node: null, nextIndex: def.nextIndex };
  }

  render() {
    return "";
  }
}

export default new LinkReferenceDefinitionParser();
