import type { EditorView } from "@codemirror/view";

/** 取选区与可视区域交集的中点，全文选中时不会锚到文档顶部 */
export function getVisibleAnchor(
  view: EditorView,
  from: number,
  to: number,
): number {
  const { from: vf, to: vt } = view.viewport;
  const visFrom = Math.max(from, vf);
  const visTo = Math.min(to, vt);
  if (visFrom < visTo) return Math.floor((visFrom + visTo) / 2);

  const head = view.state.selection.main.head;
  if (head >= from && head <= to) return head;

  return Math.floor((from + to) / 2);
}

export function positionFixedPanel(
  view: EditorView,
  panel: HTMLElement,
  anchorPos: number,
  preferAbove = true,
) {
  const coords = view.coordsAtPos(anchorPos);
  if (!coords) return;

  const margin = 10;
  const scrollerRect = view.scrollDOM.getBoundingClientRect();
  const panelW = panel.offsetWidth;
  const panelH = panel.offsetHeight;

  let top = preferAbove ? coords.top - panelH - margin : coords.bottom + margin;
  let left = coords.left + (coords.right - coords.left) / 2 - panelW / 2;

  const minLeft = scrollerRect.left + margin;
  const maxLeft = scrollerRect.right - panelW - margin;
  const minTop = scrollerRect.top + margin;
  const maxTop = scrollerRect.bottom - panelH - margin;

  left = Math.max(minLeft, Math.min(left, maxLeft));

  if (preferAbove && top < minTop) {
    top = coords.bottom + margin;
  } else if (!preferAbove && top + panelH > scrollerRect.bottom - margin) {
    top = coords.top - panelH - margin;
  }
  top = Math.max(minTop, Math.min(top, maxTop));

  panel.style.position = "fixed";
  panel.style.left = `${left}px`;
  panel.style.top = `${top}px`;
}
