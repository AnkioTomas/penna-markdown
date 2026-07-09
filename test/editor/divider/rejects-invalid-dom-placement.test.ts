/**
 * @vitest-environment jsdom
 */

import { expect, it, vi } from "vitest";
import { Divider } from "@/editor/divider/Divider";
import { Theme } from "@/theme/Theme";

const SPLIT_STORAGE_KEY = "cherry-editor-split";

function createLocalStorageMock() {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const key of Object.keys(store)) delete store[key];
    },
    key: () => null,
    length: 0,
  };
}

function createDividerTree(bodyWidth = 1000, sidebarWidth = 200) {
  document.body.innerHTML = `
    <div class="cherry-body" style="width:${bodyWidth}px">
      <div class="cherry-sidebar" style="width:${sidebarWidth}px"></div>
      <div class="cherry-editor"></div>
      <div class="cherry-divider" style="width:4px"></div>
      <div class="cherry-preview"></div>
    </div>
  `;
  const body = document.querySelector(".cherry-body")! as HTMLElement;
  const sidebar = document.querySelector(".cherry-sidebar")! as HTMLElement;
  const dividerEl = document.querySelector(".cherry-divider")! as HTMLElement;

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

  const theme = new Theme();
  const divider = new Divider(dividerEl, theme);
  return { body, dividerEl, theme, divider };
}

it("rejects invalid DOM placement", () => {
  vi.stubGlobal("localStorage", createLocalStorageMock());
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
  document.body.innerHTML = "";
  const mount = document.createElement("div");
  expect(() => new Divider(mount, new Theme())).toThrow(/必须挂载/);

  document.body.innerHTML = "";
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
