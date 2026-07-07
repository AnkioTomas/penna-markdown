/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
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
  Object.defineProperty(sidebar, "offsetWidth", { configurable: true, value: sidebarWidth });
  Object.defineProperty(sidebar, "offsetParent", { configurable: true, value: body });
  Object.defineProperty(dividerEl, "offsetWidth", { configurable: true, value: 4 });
  dividerEl.setPointerCapture = vi.fn();
  dividerEl.releasePointerCapture = vi.fn();
  dividerEl.hasPointerCapture = vi.fn().mockReturnValue(true);

  const theme = new Theme();
  const divider = new Divider(dividerEl, theme);
  return { body, dividerEl, theme, divider };
}

describe("Divider", () => {
  beforeEach(() => {
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
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("setLayout toggles body modifier classes", () => {
    const { body, divider } = createDividerTree();

    divider.setLayout("edit");
    expect(body.classList.contains("cherry-body--edit")).toBe(true);
    expect(divider.getLayout()).toBe("edit");

    divider.setLayout("preview");
    expect(body.classList.contains("cherry-body--preview")).toBe(true);

    divider.destroy();
  });

  it("setLayout emits editor:layout", () => {
    const { theme, divider } = createDividerTree();
    const handler = vi.fn();
    theme.on("editor:layout", handler);

    divider.setLayout("edit");

    expect(handler).toHaveBeenCalledWith({ mode: "edit", prev: "split" });
    divider.destroy();
  });

  it("applies split layout on construction with stored ratio", () => {
    localStorage.setItem(SPLIT_STORAGE_KEY, "0.5");
    const { body, divider } = createDividerTree(1000, 200);

    expect(body.classList.contains("cherry-body--split")).toBe(true);
    // track=796, editor=398 → 39.8% of body
    expect(body.style.getPropertyValue("--cherry-split")).toBe("39.8%");
    expect(divider.getSplit()).toBe(0.5);

    divider.destroy();
  });

  it("setSplit maps track ratio to body percentage", () => {
    const { body, divider } = createDividerTree(1000, 200);

    divider.setSplit(0.7);

    // track=796, editor=557.2 → 55.72%
    expect(body.style.getPropertyValue("--cherry-split")).toBe("55.72%");
    expect(divider.getSplit()).toBe(0.7);
    divider.destroy();
  });

  it("clamps split ratio", () => {
    const { body, divider } = createDividerTree();

    divider.setSplit(0.05);
    expect(divider.getSplit()).toBe(0.15);

    divider.setSplit(0.95);
    expect(divider.getSplit()).toBe(0.85);

    divider.destroy();
  });

  it("pointerdown alone does not change split", () => {
    const { divider, dividerEl } = createDividerTree(1000, 200);
    divider.setSplit(0.5);

    dividerEl.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, button: 0, clientX: 900 }),
    );
    document.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 0 }));

    expect(divider.getSplit()).toBe(0.5);
    divider.destroy();
  });

  it("persists split after drag", () => {
    const { divider, dividerEl } = createDividerTree(1000, 200);

    dividerEl.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, button: 0, clientX: 600 }),
    );
    document.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, button: 0, clientX: 700 }),
    );
    document.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 0 }));

    expect(localStorage.getItem(SPLIT_STORAGE_KEY)).not.toBeNull();
    divider.destroy();
  });

  it("rejects invalid DOM placement", () => {
    document.body.innerHTML = `<div class="cherry-divider"></div>`;
    const mount = document.querySelector(".cherry-divider")! as HTMLElement;
    expect(() => new Divider(mount, new Theme())).toThrow(/必须位于/);
  });
});
