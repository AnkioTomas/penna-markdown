import { CHERRY_PREVIEW_CLASS, ensurePreviewDelegation, releasePreviewDelegation } from "./delegate.js";

/** 在容器内定位 `.cherry` 根节点。 */
export function findCherryRoot(container: ParentNode | null | undefined): HTMLElement | null {
  if (!container || !("querySelector" in container)) return null;
  if ("classList" in container && (container as HTMLElement).classList.contains("cherry")) {
    return container as HTMLElement;
  }
  return container.querySelector(".cherry");
}

export function initContainer(mount: HTMLElement): void {
  mount.classList.add(CHERRY_PREVIEW_CLASS);
  ensurePreviewDelegation(mount);
}

export function setHtml(mount: HTMLElement, html: string): void {
  mount.innerHTML = html || "";
}

export function teardownContainer(mount: HTMLElement): void {
  releasePreviewDelegation(mount);
  mount.innerHTML = "";
}
