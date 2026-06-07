/**
 * 块级语法：链接引用定义 (Link Reference Definitions)
 */
import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { findLinkLabelEnd } from "@/transformer/gfm/inline/shared.js";
import { stripBlockquoteMarker } from "@/transformer/utils/tabs.js";

export function normalizeRefLabel(label) {
  let out = "";
  for (let i = 0; i < label.length; i++) {
    if (label[i] === "\\" && i + 1 < label.length && /[\[\]\\]/.test(label[i + 1])) {
      out += label[i + 1];
      i += 1;
    } else {
      out += label[i];
    }
  }
  return out.toLowerCase().replace(/\s+/g, " ").trim();
}

function hasNonWhitespace(text) {
  return /[^\s]/.test(text);
}

function finishDefinition(id, lines, labelEnd, bodyChunks) {
  let end = labelEnd + 1;
  let chunks = [...bodyChunks];
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

function ensureLinkReferenceDefinitions(store) {
  if (store.get("linkReferenceDefinitionsCollected")) return;
  const lines = store.get("lines");
  if (!lines) return;
  collectLinkReferenceDefinitions(lines, store);
  store.set("linkReferenceDefinitionsCollected", true);
}

export function lookupLinkReference(store, refId) {
  ensureLinkReferenceDefinitions(store);
  const references = store.get("references") ?? {};
  return references[normalizeRefLabel(refId)] ?? null;
}

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

function isInvalidMultilineLabel(lines, index, labelEndLine) {
  if (labelEndLine <= index) return false;
  const first = lines[index].replace(/^[ \t]{0,3}/, "");
  return !/^\[(?:\\.|[^\[\]\n\]])+/.test(first);
}

function shouldConsumeInvalidDefinitionSilently(lines, nextIndex) {
  const next = lines[nextIndex];
  return next !== undefined && next.trim() !== "";
}

function findDefinitionLabelEndLine(lines, index) {
  for (let i = index; i < lines.length; i++) {
    if (i > index && lines[i].trim() === "") return null;

    const merged = lines.slice(index, i + 1).join("\n");
    const trimmed = merged.replace(/^[ \t]{0,3}/, "");
    if (trimmed[0] !== "[") continue;

    const labelClose = findLinkLabelEnd(trimmed, 1);
    if (labelClose === -1) {
      if (i + 1 < lines.length && lines[i + 1].trim() !== "") continue;
      return { invalid: true, line: i };
    }

    let j = labelClose + 1;
    while (j < trimmed.length && /[ \t]/.test(trimmed[j])) j++;
    if (trimmed[j] === ":") return i;
  }
  return null;
}

function buildInvalidDefinition(lines, index, labelEndLine) {
  const nextIndex = labelEndLine + 1;
  const consumeSilent =
    isInvalidMultilineLabel(lines, index, labelEndLine) &&
    shouldConsumeInvalidDefinitionSilently(lines, nextIndex);
  return { invalid: true, nextIndex, consumeSilent };
}

export function parseDefinitionAt(lines, index) {
  const line = lines[index] ?? "";
  if (!/^[ \t]{0,3}\[/.test(line)) return null;

  const labelEndResult = findDefinitionLabelEndLine(lines, index);
  if (labelEndResult === null) return null;
  if (typeof labelEndResult === "object") {
    return buildInvalidDefinition(lines, index, labelEndResult.line);
  }

  const labelEndLine = labelEndResult;
  const merged = lines.slice(index, labelEndLine + 1).join("\n");
  const trimmed = merged.replace(/^[ \t]{0,3}/, "");
  const labelClose = findLinkLabelEnd(trimmed, 1);
  if (labelClose === -1) {
    return buildInvalidDefinition(lines, index, labelEndLine);
  }

  let j = labelClose + 1;
  while (j < trimmed.length && /[ \t]/.test(trimmed[j])) j++;
  if (trimmed[j] !== ":") return null;
  j += 1;
  while (j < trimmed.length && /[ \t]/.test(trimmed[j])) j++;

  const rawLabel = trimmed.slice(1, labelClose);
  if (!hasNonWhitespace(rawLabel)) {
    return buildInvalidDefinition(lines, index, labelEndLine);
  }
  if (isInvalidMultilineLabel(lines, index, labelEndLine)) {
    return buildInvalidDefinition(lines, index, labelEndLine);
  }

  const id = normalizeRefLabel(rawLabel);
  return finishDefinition(id, lines, labelEndLine, [trimmed.slice(j)]);
}

export function registerLinkReferenceDefinition(store, def) {
  const references = store.get("references") ?? {};
  if (!references[def.id]) {
    references[def.id] = { href: def.href, title: def.title };
    store.set("references", references);
  }
}

function skipBlockquote(lines, index) {
  let i = index + 1;
  while (i < lines.length) {
    const t = lines[i].replace(/^ {0,3}/, "");
    if (t.trim() === "" || !t.startsWith(">")) break;
    i += 1;
  }
  return i;
}

function canLazyContinueBlockquote(line) {
  if (line.trim() === "") return false;
  if (/^ {0,3}>/.test(line)) return false;
  if (/^ {0,3}#{1,6}(?: |$)/.test(line)) return false;
  if (/^ {0,3}(`{3,}|~{3,})/.test(line)) return false;
  if (/^ {0,3}[-+*]\s/.test(line) || /^ {0,3}\d{1,9}[.)]\s/.test(line)) return false;
  return true;
}

function normalizeInnerLines(lines) {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start].trim() === "") start += 1;
  while (end > start && lines[end - 1].trim() === "") end -= 1;
  return lines.slice(start, end);
}

function collectBlockquoteDefinitions(lines, index, store) {
  const innerLines = [];
  let i = index;

  while (i < lines.length) {
    const ln = lines[i];
    if (/^ {0,3}>/.test(ln)) {
      const stripped = stripBlockquoteMarker(ln);
      if (stripped.trim() === "") {
        const next = lines[i + 1] ?? "";
        if (/^ {0,3}>/.test(next)) {
          innerLines.push("");
          i += 1;
          continue;
        }
        i += 1;
        break;
      }
      innerLines.push(stripped);
      i += 1;
      continue;
    }

    const isHR = /^( {0,3})([-*_])([ \t]*\2){2,}[ \t]*$/.test(ln);
    if (isHR) break;

    if (innerLines.length > 0 && canLazyContinueBlockquote(ln)) {
      innerLines.push(ln);
      i += 1;
      continue;
    }
    break;
  }

  collectDefinitionsInLines(normalizeInnerLines(innerLines), store);
  return i;
}

function collectDefinitionsInLines(lines, store) {
  let i = 0;
  while (i < lines.length) {
    if (lines[i].trim() === "") {
      i += 1;
      continue;
    }

    const def = parseDefinitionAt(lines, i);
    if (def?.invalid) {
      i = def.nextIndex;
      continue;
    }

    const canDefine =
      def &&
      (i === 0 || lines[i - 1].trim() === "" || allowsReferenceDefinitionAfter(lines[i - 1]));

    if (canDefine) {
      registerLinkReferenceDefinition(store, def);
      i = def.nextIndex;
      continue;
    }

    const t = lines[i].replace(/^ {0,3}/, "");
    if (/^>{1,}/.test(t)) {
      i = collectBlockquoteDefinitions(lines, i, store);
      continue;
    }

    i = skipOneBlock(lines, i);
  }
}

function skipOneBlock(lines, index) {
  const line = lines[index] ?? "";
  if (line.trim() === "") return index + 1;

  const t = line.replace(/^ {0,3}/, "");
  if (/^#{1,6}(?: |$)/.test(t)) return index + 1;
  if (/^>{1,}/.test(t)) return skipBlockquote(lines, index);
  if (/^(?:-\s*-\s*-|\*{3,}|_{3,}|~{3,}|-\s{3,})\s*$/.test(t.trim())) return index + 1;
  if (/^(`{3,}|~{3,})/.test(t)) {
    const fence = t.match(/^(`{3,}|~{3,})/)[1];
    let i = index + 1;
    while (i < lines.length) {
      const end = lines[i].replace(/^ {0,3}/, "");
      if (end.startsWith(fence) && end.trim() === fence) return i + 1;
      i += 1;
    }
    return lines.length;
  }

  let i = index + 1;
  while (i < lines.length && lines[i].trim() !== "") {
    i += 1;
  }
  return i;
}

function allowsReferenceDefinitionAfter(prevLine) {
  if (!prevLine || prevLine.trim() === "") return true;
  const t = prevLine.replace(/^ {0,3}/, "");
  if (/^#{1,6}(?: |$)/.test(t)) return true;
  if (/^(?:-\s*-\s*-|\*{3,}|_{3,}|~{3,}|-\s{3,})\s*$/.test(t.trim())) return true;
  if (/^\[(?:\\.|[^\[\]\n])+\]:/.test(t)) return true;
  return false;
}

/** 解析前预扫描全文 reference 定义，使后续段落中的 reference link 可解析 */
export function collectLinkReferenceDefinitions(lines, store) {
  collectDefinitionsInLines(lines, store);
}

class LinkReferenceDefinitionParser extends BaseBlockParser {
  constructor() {
    super({ type: "linkReferenceDef", priority: 190, canInterruptParagraph: false });
  }

  parse(lines, index, ctx) {
    const def = parseDefinitionAt(lines, index);
    if (!def) return null;
    if (def.invalid) {
      if (def.consumeSilent) return { node: null, nextIndex: def.nextIndex };
      return null;
    }

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
