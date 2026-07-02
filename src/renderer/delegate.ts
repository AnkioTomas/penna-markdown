/** 预览区委托容器 class，所有交互事件统一绑定在此元素上。 */
export const CHERRY_PREVIEW_CLASS = "cherry-preview";

export type DelegatedClickHandler = (
  event: MouseEvent,
  target: HTMLElement,
  preview: HTMLElement,
) => void;

const clickHandlers: { selector: string; handler: DelegatedClickHandler }[] = [];
const boundPreviews = new WeakMap<HTMLElement, () => void>();

function asHtmlElement(node: unknown): HTMLElement | null {
  if (!node || typeof node !== "object" || !("classList" in node)) return null;
  return node as HTMLElement;
}

/** 注册预览区 click 委托处理器。 */
export function registerPreviewClickDelegation(
  selector: string,
  handler: DelegatedClickHandler,
): void {
  clickHandlers.push({ selector, handler });
}

/** 定位 `.cherry-preview` 容器。 */
export function findCherryPreview(container: ParentNode | null | undefined): HTMLElement | null {
  if (!container) return null;

  const direct = asHtmlElement(container);
  if (direct?.classList.contains(CHERRY_PREVIEW_CLASS)) return direct;

  if ("closest" in container && typeof container.closest === "function") {
    const closest = container.closest(`.${CHERRY_PREVIEW_CLASS}`);
    const el = asHtmlElement(closest);
    if (el) return el;
  }

  if ("querySelector" in container) {
    const found = container.querySelector(`.${CHERRY_PREVIEW_CLASS}`);
    const el = asHtmlElement(found);
    if (el) return el;
  }

  return null;
}

/** 确保预览容器具备委托监听（幂等）。 */
export function ensurePreviewDelegation(container: ParentNode | null | undefined): HTMLElement | null {
  const preview = asHtmlElement(container) ?? findCherryPreview(container);
  if (!preview) return null;

  preview.classList.add(CHERRY_PREVIEW_CLASS);

  if (boundPreviews.has(preview)) return preview;

  const onClick = (event: MouseEvent) => {
    const target = event.target;
    if (!target || typeof target !== "object" || !("closest" in target)) return;
    for (const { selector, handler } of clickHandlers) {
      const match = (target as Element).closest(selector);
      const el = asHtmlElement(match);
      if (!el || !preview.contains(el)) continue;
      handler(event, el, preview);
    }
  };

  preview.addEventListener("click", onClick);
  boundPreviews.set(preview, () => {
    preview.removeEventListener("click", onClick);
    boundPreviews.delete(preview);
  });

  return preview;
}

/** 移除预览区委托监听。 */
export function releasePreviewDelegation(preview: HTMLElement): void {
  boundPreviews.get(preview)?.();
}
