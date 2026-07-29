import { vi } from "vitest";
import { SideBarResizer } from "@/editor/sidebar/SideBarResizer";
import { createMemoryStorage } from "@/core/StorageAPI";
import type { StorageAPI } from "@/core/StorageAPI";

export function setupSideBarResizerTestGlobals(): void {
  if (typeof globalThis.PointerEvent === "undefined") {
    vi.stubGlobal(
      "PointerEvent",
      class extends MouseEvent {
        constructor(type: string, params: MouseEventInit = {}) {
          super(type, params);
        }
      },
    );
  }
}

export function createSideBarResizerTree(
  storage: StorageAPI = createMemoryStorage(),
  maxWidth?: number,
) {
  document.body.innerHTML = `
    <div class="penna-body">
      <div class="penna-sidebar"></div>
      <div class="penna-sidebar-resizer"></div>
      <div class="penna-editor"></div>
    </div>
  `;
  const sidebarEl = document.querySelector(".penna-sidebar")! as HTMLElement;
  const handleEl = document.querySelector(
    ".penna-sidebar-resizer",
  )! as HTMLElement;

  vi.spyOn(sidebarEl, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 300,
    bottom: 600,
    width: 300,
    height: 600,
    toJSON: () => ({}),
  } as DOMRect);
  handleEl.setPointerCapture = vi.fn();
  handleEl.releasePointerCapture = vi.fn();
  handleEl.hasPointerCapture = vi.fn().mockReturnValue(true);

  const resizer = new SideBarResizer(handleEl, sidebarEl, storage, maxWidth);
  return { sidebarEl, handleEl, resizer, storage };
}

export function dragSideBarResizerTo(handleEl: HTMLElement, clientX: number) {
  handleEl.dispatchEvent(
    new PointerEvent("pointerdown", { bubbles: true, button: 0, clientX: 300 }),
  );
  document.dispatchEvent(
    new PointerEvent("pointermove", { bubbles: true, button: 0, clientX }),
  );
  document.dispatchEvent(
    new PointerEvent("pointerup", { bubbles: true, button: 0 }),
  );
}

export function teardownSideBarResizerTest(): void {
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
}
