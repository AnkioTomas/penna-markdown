/**
 * 块级语法：引用块（>）
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { stripBlockquoteMarker, parseListMarkerLine } from "@/transformer/utils/tabs.js";
import { isThematicBreakLine } from "@/transformer/gfm/block/hr.js";
import { withBlockquoteFrame } from "@/transformer/gfm/block/frame.js";

/** 去掉引用块首尾仅含空白的行，保留中间空行作段落分隔 */
function normalizeInnerLines(lines) {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start].trim() === "") start += 1;
  while (end > start && lines[end - 1].trim() === "") end -= 1;
  return lines.slice(start, end);
}

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

function isSetextUnderlineLine(line) {
  return /^( {0,3})(=+|-+)[ \t]*$/.test(line ?? "");
}

/** setext 下划线但不是 HR（如 ===）；在 blockquote lazy continuation 中应作为段落文本 */
function isNonHrSetextUnderline(line) {
  return isSetextUnderlineLine(line) && !isThematicBreakLine(line);
}

function parseBlockquoteInner(ctx, lines) {
  return withBlockquoteFrame(ctx, () => ctx.parse(lines));
}

/** 无 > 前缀的行能否作为 open paragraph 的 lazy continuation */
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

class BlockquoteBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "blockquote", priority: 80 });
  }

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

  render(node, ctx) {
    const inner = ctx.renderBlock(node.children);
    if (!inner) return "<blockquote>\n</blockquote>";
    return `<blockquote>\n${inner}\n</blockquote>`;
  }
}

export default new BlockquoteBlockParser();
