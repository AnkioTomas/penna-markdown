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
  parseAngleDestination,
  parseLinkTitle,
  parsePlainDestination,
  unescapeHref,
} from "@/transformer/utils/linkDestination.js";
import { findLinkLabelEnd } from "@/transformer/utils/linkLabel.js";
import { isBlankString, normalizeLinkRefLabel, skipInlineWhitespace } from "@/transformer/utils/normalize";

export { normalizeLinkRefLabel as normalizeRefLabel };

interface LRDResult {
  consumedCharIndex: number;
  id: string;
  href: string;
  title: string;
}

/**
 * 纯游标解析 LRD 字符串。
 */
function parseLRDString(text: string): LRDResult | null {
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

  let href = "";
  if (text[i] === "<") {
    const dest = parseAngleDestination(text, i);
    if (!dest) return null;
    href = dest.href;
    i = dest.next;
  } else {
    const dest = parsePlainDestination(text, i);
    href = dest.href;
    i = dest.next;
  }

  href = unescapeHref(href);
  if (href === "") return null;

  let afterDestIndex = i;
  let title = "";

  i = skipInlineWhitespace(text, i, { allowNewline: true, maxNewlines: 1 });
  const titleParsed = parseLinkTitle(text, i);
  if (titleParsed?.closed) {
    let j = titleParsed.next;
    while (j < text.length && (text[j] === " " || text[j] === "\t")) j += 1;
    if (j >= text.length || text[j] === "\n" || text[j] === "\r") {
      title = unescapeHref(titleParsed.title);
      afterDestIndex = j;
    }
  }

  return { consumedCharIndex: afterDestIndex, id, href, title };
}

class LinkReferenceDefinitionParser extends BaseBlockParser {
  constructor() {
    super("linkReferenceDef");
  }

  /** @inheritdoc */
  canOpenAt(lines: string[], index: number): boolean {
    return skipBlockPrefixSpaces(lines[index] ?? "") < (lines[index] ?? "").length
      && lines[index]![skipBlockPrefixSpaces(lines[index]!)] === "[";
  }

  /** @inheritdoc */
  parse(lines: string[], index: number, ctx: BlockParseContext) {
    if (!this.canOpenAt(lines, index)) return null;

    const chunkLines: string[] = [];
    let endIdx = index;
    while (endIdx < lines.length && !isBlankString(lines[endIdx])) {
      chunkLines.push(lines[endIdx]);
      endIdx += 1;
    }

    const textChunk = chunkLines.join("\n");
    const result = parseLRDString(textChunk);
    if (!result) return null;

    const consumedText = textChunk.slice(0, result.consumedCharIndex);
    let lineCount = 1;
    for (const char of consumedText) {
      if (char === "\n") lineCount += 1;
    }

    const key = "ref_" + result.id;
    if (!ctx.store.has(key)) {
      ctx.store.set(key, result);
    }

    return { node: null, nextIndex: index + lineCount };
  }

  /** @inheritdoc */
  render() {
    return "";
  }
}

export default new LinkReferenceDefinitionParser();
