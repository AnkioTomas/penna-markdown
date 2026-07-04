import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import type { RenderContext } from "@/transformer/core/context/RenderContext.js";
import type { Registry } from "@/transformer/core/Registry.js";
import {
  countTopLevelDomRoots,
  isRenderedTopLevelBlock,
} from "@/transformer/utils/sourceLine.js";

export interface BlockLineAnchor {
  /** 源码起始行（0-based，含） */
  startLine: number;
  /** 源码结束行（0-based，不含） */
  endLine: number;
  type: string;
}

export { isRenderedTopLevelBlock };

/**
 * 按实际 render 输出构建滚动锚点，保证与预览 DOM 顶层子节点一一对应。
 */
export function buildScrollSyncAnchors(
  ast: MarkdownNode,
  ctx: RenderContext,
  registry: Registry,
  doc: Document,
): BlockLineAnchor[] {
  const anchors: BlockLineAnchor[] = [];
  let lineIndex = 0;

  for (const node of ast.children ?? []) {
    const span = node.length > 0 ? node.length : 0;

    if (node.props?.invisible || node.type === "blank_line") {
      lineIndex += span;
      continue;
    }

    const html = registry.getBlockParser(node.type)?.render(node, ctx) ?? "";

    if (node.type === "footnotes") {
      if (html && countTopLevelDomRoots(html, doc) === 1) {
        anchors.push({
          startLine: lineIndex > 0 ? lineIndex - 1 : 0,
          endLine: lineIndex,
          type: node.type,
        });
      }
      continue;
    }

    if (!html || span <= 0) {
      lineIndex += span;
      continue;
    }

    if (countTopLevelDomRoots(html, doc) !== 1) {
      lineIndex += span;
      continue;
    }

    anchors.push({
      startLine: lineIndex,
      endLine: lineIndex + span,
      type: node.type,
    });
    lineIndex += span;
  }

  return anchors;
}

/** @deprecated 仅保留给旧测试；运行时请用 {@link buildScrollSyncAnchors} */
export function buildBlockLineAnchors(ast: MarkdownNode): BlockLineAnchor[] {
  const anchors: BlockLineAnchor[] = [];
  let lineIndex = 0;

  for (const node of ast.children ?? []) {
    const span = node.length > 0 ? node.length : 0;
    if (isRenderedTopLevelBlock(node) && node.type !== "footnote_def" && span > 0) {
      anchors.push({
        startLine: lineIndex,
        endLine: lineIndex + span,
        type: node.type,
      });
    }
    lineIndex += span;
  }

  return anchors;
}

export function isScrollSyncAnchorBlock(node: MarkdownNode): boolean {
  return isRenderedTopLevelBlock(node) && node.type !== "footnote_def" && node.length > 0;
}
