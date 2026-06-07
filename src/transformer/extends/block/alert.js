/**
 * @file 块级语法拓展：GitHub 风格警报 / Admonition
 * @module transformer/extends/block/alert
 *
 * 语法示例：
 * ```
 * > [!NOTE]
 * > Useful information...
 * ```
 *
 * 支持类型：NOTE、TIP、IMPORTANT、WARNING、CAUTION。
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { stripBlockquoteMarker, parseListMarkerLine } from "@/transformer/utils/tabs.js";
import { isThematicBreakLine } from "@/transformer/gfm/block/hr.js";
import { withBlockquoteFrame } from "@/transformer/gfm/block/frame.js";

/** 警报类型标识 → 显示标题的映射 */
export const ALERT_TYPES = {
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  caution: "Caution",
};

/** 引用块内警报标记行：`[!NOTE]` 等 */
const ALERT_MARKER_RE = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/i;

/**
 * 去掉警报内容首尾仅含空白的行。
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
 * setext 下划线但不是 HR；在 lazy continuation 中应作为段落文本。
 *
 * @param {string} line
 * @returns {boolean}
 */
function isNonHrSetextUnderline(line) {
  return isSetextUnderlineLine(line) && !isThematicBreakLine(line);
}

/**
 * 在 blockquote 解析帧内解析警报内部内容。
 *
 * @param {import('@/transformer/core/ParserContext.js').BlockParseContext} ctx
 * @param {string[]} lines
 * @returns {{ children: import('@/transformer/core/MarkdownNode.js').MarkdownNode[] }}
 */
function parseAlertInner(ctx, lines) {
  return withBlockquoteFrame(ctx, () => ctx.parse(lines));
}

/**
 * 无 `>` 前缀的行能否作为 open paragraph 的 lazy continuation。
 *
 * @param {string[]} innerLines
 * @param {string} line
 * @param {import('@/transformer/core/ParserContext.js').BlockParseContext} ctx
 * @returns {boolean}
 */
function canLazyContinueAlert(innerLines, line, ctx) {
  if (line.trim() === "") return false;
  if (/^ {0,3}>/.test(line)) return false;
  if (isThematicBreakLine(line)) return false;
  if (/^ {0,3}#{1,6}(?: |$)/.test(line)) return false;
  if (/^ {0,3}(`{3,}|~{3,})/.test(line)) return false;
  if (parseListMarkerLine(line)) return false;
  if (innerLines.length === 0) return false;

  const before = parseAlertInner(ctx, innerLines);
  if (!endsWithOpenParagraph(before)) return false;

  if (isNonHrSetextUnderline(line)) return true;

  const after = parseAlertInner(ctx, [...innerLines, line]);
  return (
    after.children.length === before.children.length &&
    endsWithOpenParagraph(after)
  );
}

/**
 * GitHub 风格警报块解析器。
 *
 * @extends {BaseBlockParser}
 */
class AlertBlockParser extends BaseBlockParser {
  constructor() {
    super({ type: "alert", priority: 85 });
  }

  /** @inheritdoc */
  parse(lines, index, ctx) {
    const line = lines[index] ?? "";
    if (!/^ {0,3}>/.test(line)) return null;

    const stripped = stripBlockquoteMarker(line);
    const marker = stripped.match(ALERT_MARKER_RE);
    if (!marker) return null;

    const alertType = marker[1].toLowerCase();
    if (!ALERT_TYPES[alertType]) return null;

    const innerLines = [];
    let i = index + 1;

    while (i < lines.length) {
      const ln = lines[i];
      if (/^ {0,3}>/.test(ln)) {
        const inner = stripBlockquoteMarker(ln);
        if (inner.trim() === "") {
          const next = lines[i + 1] ?? "";
          if (/^ {0,3}>/.test(next)) {
            innerLines.push("");
            i += 1;
            continue;
          }
          i += 1;
          break;
        }
        innerLines.push(inner);
        i += 1;
        continue;
      }

      if (isThematicBreakLine(ln)) break;

      if (innerLines.length > 0 && canLazyContinueAlert(innerLines, ln, ctx)) {
        innerLines.push(ln);
        i += 1;
        continue;
      }
      break;
    }

    const innerAst = parseAlertInner(ctx, normalizeInnerLines(innerLines));
    const node = createNode(this.type, {
      alertType,
      children: innerAst.children,
    });

    return { node, nextIndex: i };
  }

  /** @inheritdoc */
  render(node, ctx) {
    const { alertType } = node.props;
    const title = ALERT_TYPES[alertType] ?? alertType;
    const inner = ctx.renderBlock(node.children);
    const parts = [
      `<div class="markdown-alert markdown-alert-${escapeHtml(alertType)}">`,
      `<p class="markdown-alert-title">${escapeHtml(title)}</p>`,
    ];
    if (inner) parts.push(inner);
    parts.push("</div>");
    return parts.join("\n");
  }
}

export default new AlertBlockParser();
