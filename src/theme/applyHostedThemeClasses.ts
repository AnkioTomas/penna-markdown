/**
 * body 外挂节点时补齐主题 class，复用已有 token 选择器。
 *
 * Theme 把 `penna-theme-*` / `penna-dark` 写在用户根上；预览内容靠 `penna-render`。
 * 浮层离开该树后必须自己带上这些 class，禁止在 SCSS 里再注一套 token。
 */
export function applyHostedThemeClasses(
  target: HTMLElement,
  from: HTMLElement,
): void {
  target.classList.add("penna", "penna-render");
  let el: HTMLElement | null = from;
  while (el) {
    for (const name of el.classList) {
      if (name === "penna-dark" || name.startsWith("penna-theme-")) {
        target.classList.add(name);
      }
    }
    el = el.parentElement;
  }
}
