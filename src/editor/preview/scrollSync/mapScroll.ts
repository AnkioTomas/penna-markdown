import {
  SOURCE_END_LINE_ATTR,
  SOURCE_LINE_ATTR,
} from "@/transformer/utils/sourceLine.js";

export interface MeasuredAnchor {
  startLine: number;
  endLine: number;
  type: string;
  previewY: number;
}

export const DEFAULT_SCROLL_ANCHOR_RATIO = 0.3;

/** 预览区内媒体/嵌入元素，加载后会改变块高度。 */
export const SYNC_MEDIA_SELECTOR = [
  "img:not([aria-hidden])",
  "video",
  "iframe",
  "figure.cherry-media",
  ".cherry-mermaid-block",
  ".cherry-echarts-block",
  ".cherry-math-block img",
].join(",");

/** 元素相对滚动容器内容顶部的 Y（含已滚动距离）。 */
export function blockOffsetTop(el: HTMLElement, scrollEl: HTMLElement): number {
  const scrollRect = scrollEl.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  return elRect.top - scrollRect.top + scrollEl.scrollTop;
}

function collectMediaAnchors(
  block: HTMLElement,
  scrollEl: HTMLElement,
  startLine: number,
  endLine: number,
  blockTop: number,
): MeasuredAnchor[] {
  const lineSpan = endLine - startLine;
  if (lineSpan <= 0) return [];

  const blockHeight = Math.max(block.offsetHeight, 1);
  const anchors: MeasuredAnchor[] = [];
  const seenY = new Set<number>();

  for (const el of block.querySelectorAll<HTMLElement>(SYNC_MEDIA_SELECTOR)) {
    const y = Math.round(blockOffsetTop(el, scrollEl));
    if (seenY.has(y)) continue;
    seenY.add(y);

    const dy = Math.max(0, y - blockTop);
    const line = startLine + (dy / blockHeight) * lineSpan;
    anchors.push({
      startLine: line,
      endLine: line,
      type: "media",
      previewY: y,
    });
  }

  return anchors;
}

export function measureSyncAnchors(scrollEl: HTMLElement): MeasuredAnchor[] {
  const blocks = scrollEl.querySelectorAll<HTMLElement>(`[${SOURCE_LINE_ATTR}]`);
  const anchors: MeasuredAnchor[] = [];

  for (const block of blocks) {
    const startLine = Number(block.getAttribute(SOURCE_LINE_ATTR));
    const endLine = Number(block.getAttribute(SOURCE_END_LINE_ATTR));
    if (!Number.isFinite(startLine) || !Number.isFinite(endLine)) continue;

    const blockTop = blockOffsetTop(block, scrollEl);
    const blockBottom = blockTop + block.offsetHeight;

    anchors.push({
      startLine,
      endLine: startLine,
      type: "block",
      previewY: blockTop,
    });

    anchors.push(...collectMediaAnchors(block, scrollEl, startLine, endLine, blockTop));

    anchors.push({
      startLine: endLine,
      endLine,
      type: "block-end",
      previewY: blockBottom,
    });
  }

  return sortAnchors(anchors);
}

export function sortAnchors(anchors: MeasuredAnchor[]): MeasuredAnchor[] {
  return [...anchors].sort((a, b) => a.previewY - b.previewY || a.startLine - b.startLine);
}

function findSegmentIndex(anchors: MeasuredAnchor[], line: number): number {
  if (anchors.length === 0) return 0;
  let i = 0;
  while (i < anchors.length - 1 && line >= segmentEndLine(anchors, i)) {
    i += 1;
  }
  return i;
}

function segmentEndLine(anchors: MeasuredAnchor[], index: number): number {
  const current = anchors[index]!;
  const next = anchors[index + 1];
  return next?.startLine ?? current.endLine;
}

function interpolatePreviewY(
  anchors: MeasuredAnchor[],
  line: number,
  contentEndY: number,
): number {
  if (anchors.length === 0) return 0;

  const i = findSegmentIndex(anchors, line);
  const current = anchors[i]!;
  const next = anchors[i + 1];
  const endLine = segmentEndLine(anchors, i);
  const endY = next?.previewY ?? contentEndY;
  const lineSpan = endLine - current.startLine;
  const t = lineSpan > 0 ? (line - current.startLine) / lineSpan : 0;
  return current.previewY + t * (endY - current.previewY);
}

export function previewScrollTopForSourceLine(
  line: number,
  anchors: MeasuredAnchor[],
  scrollEl: HTMLElement,
  ratio = DEFAULT_SCROLL_ANCHOR_RATIO,
): number {
  if (anchors.length === 0) return 0;
  const contentEndY = scrollEl.scrollHeight;
  const targetY = interpolatePreviewY(anchors, line, contentEndY);
  return Math.max(0, targetY - scrollEl.clientHeight * ratio);
}

export function sourceLineForPreviewScroll(
  scrollTop: number,
  anchors: MeasuredAnchor[],
  scrollEl: HTMLElement,
  ratio = DEFAULT_SCROLL_ANCHOR_RATIO,
): number {
  if (anchors.length === 0) return 0;

  const contentY = scrollTop + scrollEl.clientHeight * ratio;
  let i = 0;
  while (i < anchors.length - 1 && contentY >= anchors[i + 1]!.previewY) {
    i += 1;
  }

  const current = anchors[i]!;
  const next = anchors[i + 1];
  const endY = next?.previewY ?? scrollEl.scrollHeight;
  const endLine = segmentEndLine(anchors, i);
  const spanY = endY - current.previewY;
  const t = spanY > 0 ? (contentY - current.previewY) / spanY : 0;
  const lineSpan = endLine - current.startLine;
  return current.startLine + t * lineSpan;
}

export function applyScrollRatio(from: HTMLElement, to: HTMLElement): void {
  const fromMax = from.scrollHeight - from.clientHeight;
  const toMax = to.scrollHeight - to.clientHeight;
  const ratio = fromMax > 0 ? from.scrollTop / fromMax : 0;
  to.scrollTop = ratio * Math.max(0, toMax);
}
