/**
 * @file 块级语法：链接引用定义 (Link Reference Definition)
 * @module transformer/gfm/block/linkReferenceDefinition
 *
 * 语法：`[label]: url "title"`
 * 解析结果仅存入 ctx.store，不生成可见的 AST 节点。
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { BlockParseContext } from "@/transformer/core/context/BlockParseContext";
import { skipBlockPrefixSpaces } from "@/transformer/utils/blockPrefix.js";
import {
  normalizeLinkDestination,
  normalizeLinkTitle,
  parseAngleDestination,
  parseLinkTitle,
  parsePlainDestination,
} from "@/transformer/utils/linkDestination.js";
import { findLinkLabelEnd } from "@/transformer/utils/linkLabel.js";
import { getSetextUnderlineInfo } from "@/transformer/gfm/block/setext_heading.js";
import { isBlankString, normalizeLinkRefLabel, skipInlineWhitespace } from "@/transformer/utils/normalize";

export { normalizeLinkRefLabel as normalizeRefLabel };

function isObviousBlockStarter(line: string): boolean {
  const t = line.trimStart();
  if (!t) return false;
  if (/^#{1,6}(?:\s|$)/.test(t)) return true;
  if (/^>{1,}/.test(t)) return true;
  if (/^(`{3,}|~{3,})/.test(t)) return true;
  if (/^(?:-|\*|_)(?:\s*(?:-|\*|_)){2,}\s*$/.test(t)) return true;
  if (getSetextUnderlineInfo(line) > 0) return true;
  if (/^[-*+]\s/.test(t) || /^\d+\.\s/.test(t)) return true;
  return false;
}

interface LRDResult {
  id: string;
  href: string;
  title: string;
}

function isLRDLineStart(line: string): boolean {
  let i = skipBlockPrefixSpaces(line);
  if (i >= line.length || line[i] !== "[") return false;
  const labelEnd = findLinkLabelEnd(line, i + 1);
  if (labelEnd === -1) return false;
  i = labelEnd + 1;
  i = skipInlineWhitespace(line, i, { allowNewline: false });
  return i < line.length && line[i] === ":";
}

/** LRD 的 destination/title 续行（非新定义起点） */
function isLRDContinuationLine(line: string): boolean {
  if (isLRDLineStart(line)) return false;
  if (/^[\t ]/.test(line)) return true;
  const trimmed = line.trimStart();
  return trimmed.startsWith("<") || trimmed.startsWith("/");
}

function canFollowLRDLine(lines: string[], index: number, ctx: BlockParseContext): boolean {
  if (index <= 0) return true;
  if (isBlankString(lines[index - 1] ?? "")) return true;
  const prev = lines[index - 1] ?? "";
  return ctx.isBlockStarter(lines, index - 1)
    || isLRDLineStart(prev)
    || isLRDContinuationLine(prev);
}

function tryParseLRDBlock(
  lines: string[],
  index: number,
): { result: LRDResult; nextIndex: number } | null {
  let endIdx = index;
  let result: LRDResult | null = null;
  let nextIndex = index;

  while (endIdx < lines.length && !isBlankString(lines[endIdx] ?? "")) {
    if (endIdx > index && (isLRDLineStart(lines[endIdx] ?? "") || isObviousBlockStarter(lines[endIdx] ?? ""))) {
      break;
    }
    const parsed = parseLRDString(lines.slice(index, endIdx + 1).join("\n"));
    if (parsed) {
      result = parsed;
      nextIndex = endIdx + 1;
    } else if (result !== null) {
      break;
    }
    endIdx += 1;
  }

  if (!result) return null;
  return { result, nextIndex };
}

/** label 跨行但未闭合 — 无效定义，静默吞掉 */
function hasMultilineBrokenLabel(lines: string[], index: number): boolean {
  const line = lines[index] ?? "";
  let i = skipBlockPrefixSpaces(line);
  if (i >= line.length || line[i] !== "[") return false;
  if (findLinkLabelEnd(line, i + 1) !== -1) return false;

  let endIdx = index + 1;
  while (endIdx <= lines.length) {
    const chunk = lines.slice(index, endIdx).join("\n");
    if (/\]:\s*\S/.test(chunk) && parseLRDString(chunk) === null) {
      return true;
    }
    if (endIdx >= lines.length || isBlankString(lines[endIdx] ?? "")) {
      return false;
    }
    endIdx += 1;
  }
  return false;
}

/** 无效定义（label 含换行）：吞掉至 `]: dest` 完成 */
function consumeInvalidLRDBlock(lines: string[], index: number): number {
  let endIdx = index + 1;
  while (endIdx <= lines.length) {
    const chunk = lines.slice(index, endIdx).join("\n");
    if (/\]:\s*\S/.test(chunk)) {
      return endIdx;
    }
    if (endIdx >= lines.length || isBlankString(lines[endIdx] ?? "")) {
      return endIdx;
    }
    if (endIdx > index && (isObviousBlockStarter(lines[endIdx] ?? "") || isLRDLineStart(lines[endIdx] ?? ""))) {
      return endIdx;
    }
    endIdx += 1;
  }
  return endIdx;
}

/**
 * 纯游标解析 LRD 字符串；失败返回 null（不部分注册）。
 */
export function parseLRDString(text: string): LRDResult | null {
  let i = skipBlockPrefixSpaces(text);
  if (i >= text.length || text[i] !== "[") return null;

  const labelEnd = findLinkLabelEnd(text, i + 1);
  if (labelEnd === -1) return null;

  const label = text.slice(i + 1, labelEnd);
  const id = normalizeLinkRefLabel(label);
  if (id === "") return null;

  i = labelEnd + 1;
  if (i >= text.length || text[i] !== ":") return null;
  i += 1;

  i = skipInlineWhitespace(text, i, { allowNewline: true, maxNewlines: 1 });
  if (i >= text.length) return null;

  let hrefRaw = "";
  let usedAngle = false;
  if (text[i] === "<") {
    usedAngle = true;
    const dest = parseAngleDestination(text, i);
    if (!dest) return null;
    hrefRaw = dest.href;
    i = dest.next;
  } else {
    const dest = parsePlainDestination(text, i);
    hrefRaw = dest.href;
    i = dest.next;
  }

  const beforeTitleWs = i;
  i = skipInlineWhitespace(text, i, { allowNewline: true, maxNewlines: 1 });

  if (usedAngle && i === beforeTitleWs && i < text.length) {
    const ch = text[i];
    if (ch === '"' || ch === "'" || ch === "(") return null;
  }

  let titleRaw = "";
  if (i < text.length && (text[i] === '"' || text[i] === "'" || text[i] === "(")) {
    const titleParsed = parseLinkTitle(text, i);
    if (!titleParsed?.closed) return null;
    if (/\n\s*\n/.test(titleParsed.title)) return null;
    titleRaw = titleParsed.title;
    i = titleParsed.next;
  }

  i = skipInlineWhitespace(text, i, { allowNewline: true, maxNewlines: Number.MAX_SAFE_INTEGER });
  if (i < text.length) return null;

  return {
    id,
    href: normalizeLinkDestination(hrefRaw),
    title: titleRaw ? normalizeLinkTitle(titleRaw) : "",
  };
}

class LinkReferenceDefinitionParser extends BaseBlockParser {
  constructor() {
    super("linkReferenceDef");
  }

  /** @inheritdoc */
  canOpenAt(lines: string[], index: number, ctx: BlockParseContext): boolean {
    if (!canFollowLRDLine(lines, index, ctx)) return false;
    const line = lines[index] ?? "";
    if (skipBlockPrefixSpaces(line) >= line.length || line[skipBlockPrefixSpaces(line)] !== "[") {
      return false;
    }
    return tryParseLRDBlock(lines, index) !== null
      || hasMultilineBrokenLabel(lines, index);
  }

  /** @inheritdoc */
  parse(lines: string[], index: number, ctx: BlockParseContext) {
    const parsed = tryParseLRDBlock(lines, index);
    if (parsed) {
      const key = "ref_" + parsed.result.id;
      if (!ctx.store.has(key)) {
        ctx.store.set(key, parsed.result);
      }
      return { node: null, nextIndex: parsed.nextIndex };
    }

    if (hasMultilineBrokenLabel(lines, index)) {
      return { node: null, nextIndex: consumeInvalidLRDBlock(lines, index) };
    }

    return null;
  }

  /** @inheritdoc */
  render() {
    return "";
  }
}

export default new LinkReferenceDefinitionParser();
