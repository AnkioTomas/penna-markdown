import type { BlockLineAnchor } from "./blockLineMap.js";

export const SYNC_ANCHOR_CLASS = "cherry-sync-anchor";

export function clearSyncAnchors(root: ParentNode): void {
  root.querySelectorAll(`.${SYNC_ANCHOR_CLASS}`).forEach((node) => node.remove());
}

function createAnchor(startLine: number): HTMLSpanElement {
  const anchor = document.createElement("span");
  anchor.className = SYNC_ANCHOR_CLASS;
  anchor.hidden = true;
  anchor.setAttribute("aria-hidden", "true");
  anchor.dataset.sourceLine = String(startLine);
  return anchor;
}

/** 在预览根节点为每个顶层块注入 hidden 锚点；块数不一致时返回 false。 */
export function injectSyncAnchors(
  root: HTMLElement,
  anchors: BlockLineAnchor[],
): boolean {
  clearSyncAnchors(root);

  const blocks = [...root.children].filter(
    (el) => !el.classList.contains(SYNC_ANCHOR_CLASS),
  );
  if (blocks.length !== anchors.length) return false;

  for (let i = 0; i < anchors.length; i++) {
    const block = blocks[i]!;
    root.insertBefore(createAnchor(anchors[i]!.startLine), block);
  }

  return true;
}
