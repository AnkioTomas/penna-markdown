import type { EditorView } from "@codemirror/view";

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
