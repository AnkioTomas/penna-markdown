import { vi } from "vitest";
import { Divider } from "@/editor/divider/Divider";
import { createTestEventBus } from "../../_helpers/eventBus";
import { createMemoryStorage } from "@/core/StorageAPI";
import type { StorageAPI } from "@/core/StorageAPI";

export function setupDividerTestGlobals(): void {
  vi.stubGlobal(
    "ResizeObserver",
    vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
      unobserve: vi.fn(),
    })),
  );
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

export function createDividerTree(
  storage: StorageAPI = createMemoryStorage(),
  bodyWidth = 1000,
  sidebarWidth = 200,
) {
  document.body.innerHTML = `
    <div class="penna-body" style="width:${bodyWidth}px">
      <div class="penna-sidebar" style="width:${sidebarWidth}px"></div>
      <div class="penna-editor"></div>
      <div class="penna-divider" style="width:4px"></div>
      <div class="penna-preview"></div>
    </div>
  `;
  const body = document.querySelector(".penna-body")! as HTMLElement;
  const sidebar = document.querySelector(".penna-sidebar")! as HTMLElement;
  const dividerEl = document.querySelector(".penna-divider")! as HTMLElement;

  vi.spyOn(body, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: bodyWidth,
    bottom: 0,
    width: bodyWidth,
    height: 600,
    toJSON: () => ({}),
  } as DOMRect);
  Object.defineProperty(sidebar, "offsetWidth", {
    configurable: true,
    value: sidebarWidth,
  });
  Object.defineProperty(sidebar, "offsetParent", {
    configurable: true,
    value: body,
  });
  Object.defineProperty(dividerEl, "offsetWidth", {
    configurable: true,
    value: 4,
  });
  dividerEl.setPointerCapture = vi.fn();
  dividerEl.releasePointerCapture = vi.fn();
  dividerEl.hasPointerCapture = vi.fn().mockReturnValue(true);

  const eventBus = createTestEventBus();
  const divider = new Divider(dividerEl, eventBus, storage);
  return { body, dividerEl, eventBus, divider, storage };
}

export function teardownDividerTest(): void {
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
}
