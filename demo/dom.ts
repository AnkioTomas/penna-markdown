/** 按选择器获取元素，缺失时抛错（避免满屏 null 检查）。 */
export function requiredEl<T extends Element>(
  selector: string,
  root: ParentNode = document,
): T {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`未找到元素: ${selector}`);
  }
  return el as T;
}

/** 按 id 获取元素，缺失时抛错。 */
export function requiredById<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`未找到元素: #${id}`);
  }
  return el as T;
}
