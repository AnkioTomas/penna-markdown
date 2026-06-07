/**
 * @file 块级语法：引用块
 * @module transformer/gfm/block/blockquote
 *
 * CommonMark 引用块（`>` 前缀），支持 lazy continuation。
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { stripBlockquoteMarker, parseListMarkerLine } from "@/transformer/utils/tabs.js";
import { isThematicBreakLine } from "@/transformer/gfm/block/hr.js";
import { withBlockquoteFrame } from "@/transformer/gfm/block/frame.js";

/**
 * 去掉引用块首尾仅含空白的行，保留中间空行作段落分隔。
 *
 * @param {string[]} lines
 * @returns {string[]}
 */
function normalizeInnerLines(lines) {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start].trim() === "") start += 1;
  while (end > start && lines[end - 1].trim() === "") end -= 1;
  return lines.slice(start, end);
}

/**
 * 判断 AST 是否以未闭合段落结尾（用于 lazy continuation）。
 *
 * @param {{ children: import('@/transformer/core/MarkdownNode.js').MarkdownNode[] }} ast
 * @returns {boolean}
 */
function endsWithOpenParagraph(ast) {
  if (!ast.children.length) return false;
  let node = ast.children[ast.children.length - 1];
  while (node) {
    if (node.type === "paragraph") return true;
    if (node.type === "blockquote" && node.children.length) {
      node = node.children[node.children.length - 1];
      continue;
    }
    if (node.type === "list" && node.children.length) {
      node = node.children[node.children.length - 1];
      continue;
    }
    if (node.type === "list_item" && node.children.length) {
      node = node.children[node.children.length - 1];
      continue;
    }
    return false;
  }
  return false;
}

/**
 * 是否为 setext 标题下划线行。
 *
 * @param {string} line
 * @returns {boolean}
 */
function isSetextUnderlineLine(line) {
  return /^( {0,3})(=+|-+)[ \t]*$/.test(line ?? "");
}

/**
 * setext 下划线但不是 HR（如 ===）；在 blockquote lazy continuation 中应作为段落文本。
 *
 * @param {string} line
 * @returns {boolean}
 */
function isNonHrSetextUnderline(line) {
  return isSetextUnderlineLine(line) && !isThematicBreakLine(line);
}

/**
 * 在 blockquote 栈帧内解析内部块。
 *
 * @param {import('@/transformer/core/ParserContext.js').BlockParseContext} ctx
 * @param {string[]} lines
 * @returns {import('@/transformer/core/MarkdownNode.js').MarkdownNode}
 */
function parseBlockquoteInner(ctx, lines) {
  return withBlockquoteFrame(ctx, () => ctx.parse(lines));
}

/**
 * 无 > 前缀的行能否作为 open paragraph 的 lazy continuation。
 *
 * @param {string[]} innerLines
 * @param {string} line
 * @param {import('@/transformer/core/ParserContext.js').BlockParseContext} ctx
 * @returns {boolean}
 */
function canLazyContinueBlockquote(innerLines, line, ctx) {
  if (line.trim() === "") return false;
  if (/^ {0,3}>/.test(line)) return false;
  if (isThematicBreakLine(line)) return false;
  if (/^ {0,3}#{1,6}(?: |$)/.test(line)) return false;
  if (/^ {0,3}(`{3,}|~{3,})/.test(line)) return false;
  if (parseListMarkerLine(line)) return false;
  if (innerLines.length === 0) return false;

  const before = parseBlockquoteInner(ctx, innerLines);
  if (!endsWithOpenParagraph(before)) return false;

  if (isNonHrSetextUnderline(line)) return true;

  const after = parseBlockquoteInner(ctx, [...innerLines, line]);
  return (
    after.children.length === before.children.length &&
    endsWithOpenParagraph(after)
  );
}

/**
 * 引用块解析器。
 *
 * @extends {BaseBlockParser}
 */
class BlockquoteBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "blockquote", priority: 80 });
  }

  /** @inheritdoc */
  parse(lines, index, ctx) {
    const line = lines[index] ?? "";
    if (!/^ {0,3}>/.test(line)) return null;

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

      if (isThematicBreakLine(ln)) break;

      if (innerLines.length > 0 && canLazyContinueBlockquote(innerLines, ln, ctx)) {
        innerLines.push(ln);
        i += 1;
        continue;
      }
      break;
    }

    const innerAst = parseBlockquoteInner(ctx, normalizeInnerLines(innerLines));
    const node = createNode("blockquote", { children: innerAst.children });

    return { node, nextIndex: i };
  }

  /** @inheritdoc */
  render(node, ctx) {
    const inner = ctx.renderBlock(node.children);
    if (!inner) return "<blockquote>\n</blockquote>";
    return `<blockquote>\n${inner}\n</blockquote>`;
  }
}

export default new BlockquoteBlockParser();
