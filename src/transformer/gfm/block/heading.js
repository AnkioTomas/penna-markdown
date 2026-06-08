/**
 * @file 块级语法：标题
 * @module transformer/gfm/block/heading
 *
 * ATX 标题（# ~ ######）与 Setext 标题 (===, ---)。
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { isInBlockquote } from "@/transformer/gfm/block/blockquote.js";

/**
 * 解析 ATX 标题行。
 *
 * @param {string} line
 * @returns {{ level: number, content: string } | null}
 */
function parseAtxHeading(line) {
  if (/^ {4}/.test(line)) return null;

  const m = line.match(/^( {0,3})(#{1,6})(.*)$/);
  if (!m) return null;

  const level = m[2].length;
  const rest = m[3];

  if (rest.length > 0 && !/^[ \t]/.test(rest)) return null;

  if (rest === "" || /^[ \t]*$/.test(rest)) {
    return { level, content: "" };
  }

  if (/^[ \t]*#+[ \t]*$/.test(rest)) {
    return { level, content: "" };
  }

  let inner = rest.replace(/^[ \t]+/, "");
  inner = stripClosingHashes(inner);

  return { level, content: inner.trim() };
}

/**
 * 去掉 ATX 标题末尾可选的 closing hashes。
 *
 * @param {string} inner
 * @returns {string}
 */
function stripClosingHashes(inner) {
  let end = inner.length;
  while (end > 0 && (inner[end - 1] === " " || inner[end - 1] === "\t")) {
    end -= 1;
  }

  let start = end;
  while (start > 0) {
    const ch = inner[start - 1];
    if (ch === "#" && (start < 2 || inner[start - 2] !== "\\")) {
      start -= 1;
      continue;
    }
    break;
  }

  if (start === end) return inner;

  let wsEnd = start;
  while (wsEnd > 0 && (inner[wsEnd - 1] === " " || inner[wsEnd - 1] === "\t")) {
    wsEnd -= 1;
  }
  if (wsEnd === start) return inner;

  return inner.slice(0, wsEnd);
}

/**
 * 标题块解析器。
 *
 * @extends {BaseBlockParser}
 */
class HeadingBlockParser extends BaseBlockParser {
  constructor() {
    // 优先级 98：在 Code (100) 之后，但高于 HR (95)
    super({ type: "heading", priority: 98 });
    // ATX 标题可以打断段落，Setext 下划线为了实现识别也需要“打断”逻辑
    this.canInterruptParagraph = true;
  }

  /** @inheritdoc */
  canOpenAt(lines, index, ctx) {
    const line = lines[index] ?? "";
    if (parseAtxHeading(line)) return true;

    const setextMatch = line.match(/^( {0,3})(=+|-+)[ \t]*$/);
    if (!setextMatch) return false;
    if (isInBlockquote(ctx)) return false;
    if (index > 0 && (lines[index - 1] ?? "").trim() === "") return false;
    return true;
  }

  /** @inheritdoc */
  parse(lines, index, ctx) {
    const line = lines[index] ?? "";

    // 1. ATX Heading
    const atx = parseAtxHeading(line);
    if (atx) {
      const node = createNode(this.type, {
        children: ctx.parseInline(atx.content),
        level: atx.level
      });
      return { node, nextIndex: index + 1 };
    }

    // 2. Setext Heading
    // 当当前行是下划线时，尝试寻找前一个段落块
    const setextMatch = line.match(/^( {0,3})(=+|-+)[ \t]*$/);
    if (setextMatch) {
        // blockquote 内不允许 setext（下划线为 lazy continuation 文本）
        if (isInBlockquote(ctx)) return null;

        // Setext 下划线不能跟在空行后面
        if (index > 0 && (lines[index - 1] ?? "").trim() === "") {
            return null;
        }

        if (ctx.prevNodes?.length > 0) {
            const lastNode = ctx.prevNodes[ctx.prevNodes.length - 1];
            if (lastNode.type === "paragraph") {
                const level = setextMatch[2][0] === "=" ? 1 : 2;
                const node = createNode(this.type, {
                    level,
                    children: lastNode.children // 直接复用段落已解析的行内节点
                });
                return {
                    node,
                    nextIndex: index + 1,
                    replaceLast: true
                };
            }
        }
    }

    return null;
  }

  /** @inheritdoc */
  render(node, ctx) {
    const inner = ctx.renderInline(node.children);
    return `<h${node.props.level}>${inner}</h${node.props.level}>`;
  }
}

export default new HeadingBlockParser();
