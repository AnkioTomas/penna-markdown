/**
 * 块级语法：引用块（>）
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { stripBlockquoteMarker } from "@/transformer/utils/tabs.js";

function canLazyContinue(line) {
  if (line.trim() === "") return false;
  if (/^ {0,3}>/.test(line)) return false;
  if (/^ {4}/.test(line)) return false;
  return true;
}

/** 去掉引用块首尾仅含空白的行，保留中间空行作段落分隔 */
function normalizeInnerLines(lines) {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start].trim() === "") start += 1;
  while (end > start && lines[end - 1].trim() === "") end -= 1;
  return lines.slice(start, end);
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
        innerLines.push(stripBlockquoteMarker(ln));
        i += 1;
        continue;
      }
      
      // 检查这一行是否会在同一层级被解析为非段落块（如 HR）
      // 如果是，则它不能作为 lazy continuation，而是应该结束当前引用块。
      const isHR = /^( {0,3})([-*_])([ \t]*\2){2,}[ \t]*$/.test(ln);
      if (isHR) break;

      if (innerLines.length > 0 && canLazyContinue(ln)) {
        // 对于 Lazy Continuation 线，我们将其合并到上一行中。
        // 这样在 inner parse 时，它就不再是一个独立的行，从而无法被识别为独立的块。
        // 这符合规范：Lazy continuation 线只能是文本，不能是其他块（除段落外）。
        const content = ln.replace(/^ {0,3}/, "");
        innerLines[innerLines.length - 1] += "\n" + content;
        i += 1;
        continue;
      }
      break;
    }

    const innerAst = ctx.parse(normalizeInnerLines(innerLines));
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
