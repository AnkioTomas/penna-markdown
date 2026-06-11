/**
 * @file 代码块折叠展开交互
 * @module renderer/codeCollapse
 */

/**
 * @param {ParentNode | null | undefined} container
 * @returns {HTMLElement | null}
 */
function findCherryRoot(container) {
  if (!container || !("querySelector" in container)) return null;
  if ("classList" in container && container.classList.contains("cherry")) {
    return container;
  }
  return container.querySelector(".cherry");
}

/**
 * 为可折叠代码块绑定展开/收起按钮。
 *
 * @param {ParentNode | null | undefined} container
 */
export function hydrateCherryCodeCollapse(container) {
  const root = findCherryRoot(container) ?? container;
  if (!root || !("querySelectorAll" in root)) return;

  root.querySelectorAll(".cherry-code-block__panel--collapsible").forEach((panel) => {
    const btn = panel.querySelector(".cherry-code-block__expand");
    if (!(btn instanceof HTMLButtonElement)) return;
    if (btn.dataset.cherryCollapseBound === "1") return;
    btn.dataset.cherryCollapseBound = "1";

    const label = btn.querySelector(".cherry-code-block__expand-label");

    btn.addEventListener("click", () => {
      const collapsed = panel.classList.toggle("cherry-code-block__panel--collapsed");
      btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
      if (label) {
        label.textContent = collapsed ? "展开代码" : "收起代码";
      }
    });
  });
}
