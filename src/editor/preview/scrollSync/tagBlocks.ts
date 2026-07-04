import type { BlockLineAnchor } from "./blockLineMap.js";

import {
  SOURCE_END_LINE_ATTR,
  SOURCE_LINE_ATTR,
} from "@/transformer/utils/sourceLine.js";

export { SOURCE_LINE_ATTR, SOURCE_END_LINE_ATTR };

export function clearSyncTags(root: ParentNode): void {
  root.querySelectorAll(`[${SOURCE_LINE_ATTR}]`).forEach((node) => {
    node.removeAttribute(SOURCE_LINE_ATTR);
    node.removeAttribute(SOURCE_END_LINE_ATTR);
  });
}

function blockChildren(root: HTMLElement): HTMLElement[] {
  return [...root.children].filter((el): el is HTMLElement => el instanceof HTMLElement);
}

/** 给预览顶层块打行号标记；块数不一致时返回 false。 */
export function tagSyncBlocks(root: HTMLElement, anchors: BlockLineAnchor[]): boolean {
  clearSyncTags(root);

  const blocks = blockChildren(root);
  if (blocks.length !== anchors.length) return false;

  for (let i = 0; i < anchors.length; i++) {
    const block = blocks[i]!;
    const anchor = anchors[i]!;
    block.setAttribute(SOURCE_LINE_ATTR, String(anchor.startLine));
    block.setAttribute(SOURCE_END_LINE_ATTR, String(anchor.endLine));
  }

  return true;
}

export function countTaggedBlocks(root: ParentNode): number {
  return root.querySelectorAll(`[${SOURCE_LINE_ATTR}]`).length;
}
