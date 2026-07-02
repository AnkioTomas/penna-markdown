import { registerPreviewClickDelegation } from "../delegate.js";

function handleCollapseClick(btn: HTMLElement): void {
  const panel = btn.closest(".cherry-code-block__panel--collapsible");
  if (!panel) return;

  const label = btn.querySelector(".cherry-code-block__expand-label");
  const isCollapsed = panel.classList.toggle("cherry-code-block__panel--collapsed");
  btn.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
  if (label) {
    label.textContent = isCollapsed ? "展开代码" : "收起代码";
  }
}

registerPreviewClickDelegation(".cherry-code-block__expand", (event, target) => {
  event.preventDefault();
  handleCollapseClick(target);
});
