import { findCherryRoot } from "../container.js";
import { refreshAfterTheme } from "./refresh.js";

/** 监听外层主题 class 变化并触发回调。 */
export function watchCherryTheme(
  container: ParentNode | null | undefined,
  onThemeChange: (mount: HTMLElement) => void = refreshAfterTheme,
): () => void {
  const cherry = findCherryRoot(container);
  const wrap = cherry?.parentElement;
  if (!cherry || !wrap) return () => {};

  const mount = ("classList" in (container ?? {}) ? container : cherry) as HTMLElement;
  const run = () => onThemeChange(mount);
  const observer = new MutationObserver(run);
  observer.observe(wrap, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}
