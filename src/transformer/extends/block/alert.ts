/**
 * @file 块级语法拓展：GitHub 风格警报 / Admonition
 * @module transformer/extends/block/alert
 */

import { BaseBlockParser } from "@/transformer/core/ParserBase.js";
import { createNode, type MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { escapeHtml } from "@/transformer/utils/escape.js";
import { stripBlockquoteMarker } from "@/transformer/utils/tabs.js";
import { isThematicBreakLine } from "@/transformer/gfm/block/hr.js";
import { withBlockquoteFrame } from "@/transformer/gfm/block/blockquote.js";
import { isBlankString, normalizeInnerLines } from "@/transformer/utils/normalize.js";
import { canGenericLazyContinue } from "@/transformer/utils/lazyContinuation.js";
import type { BlockParseContext } from "@/transformer/core/context/BlockParseContext.js";
import type { RenderContext } from "@/transformer/core/context/RenderContext.js";

const BLOCKQUOTE_LINE = /^ {0,3}>/;

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

function parseAlertType(line: string): string | null {
  if (!BLOCKQUOTE_LINE.test(line)) return null;
  const stripped = stripBlockquoteMarker(line);
  const marker = stripped.match(ALERT_MARKER_RE);
  if (!marker) return null;
  const alertType = marker[1].toLowerCase();
  return ALERT_TYPES[alertType as keyof typeof ALERT_TYPES] ? alertType : null;
}

/**
 * GitHub 风格警报块解析器。
 */
class AlertBlockParser extends BaseBlockParser {
  constructor() {
    super("alert");
  }

  /** @inheritdoc */
  canOpenAt(lines: string[], index: number, _ctx: BlockParseContext): boolean {
    return parseAlertType(lines[index] ?? "") !== null;
  }

  /** @inheritdoc */
  parse(lines: string[], index: number, ctx: BlockParseContext) {
    const alertType = parseAlertType(lines[index] ?? "");
    if (!alertType) return null;

    return withBlockquoteFrame(ctx, () => {
      const innerLines: string[] = [];
      let i = index + 1;

      while (i < lines.length) {
        const ln = lines[i];

        if (isBlankString(ln)) {
          i += 1;
          break;
        }

        if (BLOCKQUOTE_LINE.test(ln)) {
          const inner = stripBlockquoteMarker(ln);

          if (isBlankString(inner)) {
            const next = lines[i + 1] ?? "";
            if (BLOCKQUOTE_LINE.test(next)) {
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

        if (
          canGenericLazyContinue(
            ctx,
            normalizeInnerLines(innerLines),
            ln,
            (probeLines) => ctx.parseBlocks(probeLines),
          )
        ) {
          innerLines.push(ln);
          i += 1;
          continue;
        }

        break;
      }

      const node = createNode(
        this.type,
        i - index,
        undefined,
        ctx.parseBlocks(normalizeInnerLines(innerLines)),
        { alertType },
      );

      return { node, nextIndex: i };
    });
  }

  /** @inheritdoc */
  render(node: MarkdownNode, ctx: RenderContext) {
    const alertType = String(node.props?.alertType ?? "note");
    const title = ALERT_TYPES[alertType as keyof typeof ALERT_TYPES] ?? alertType;
    const inner = ctx.renderBlock(node.children ?? []);
    const parts: string[] = [
      `<div class="cherry-alert cherry-alert--${escapeHtml(alertType)}">`,
      `<p class="cherry-alert__title">${escapeHtml(title)}</p>`,
    ];
    if (inner) parts.push(inner);
    parts.push("</div>");
    return parts.join("\n");
  }
}

export default new AlertBlockParser();
