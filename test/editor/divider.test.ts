/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Divider } from "@/editor/divider/Divider";
import { Theme } from "@/theme/Theme";

function createDividerTree() {
  document.body.innerHTML = `
    <div class="cherry-body">
      <div class="cherry-sidebar"></div>
      <div class="cherry-editor"></div>
      <div class="cherry-divider"></div>
      <div class="cherry-preview"></div>
    </div>
  `;
  const body = document.querySelector(".cherry-body")! as HTMLElement;
  const dividerEl = document.querySelector(".cherry-divider")! as HTMLElement;
  const theme = new Theme();
  const divider = new Divider(dividerEl, theme);
  return { body, dividerEl, theme, divider };
}

describe("Divider", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
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

  it("applies split layout on construction", () => {
    const { body, divider } = createDividerTree();

    expect(body.classList.contains("cherry-body--split")).toBe(true);
    expect(body.style.getPropertyValue("--cherry-split")).toBe("50%");

    divider.destroy();
  });

  it("setSplit updates --cherry-split on body", () => {
    const { body, divider } = createDividerTree();

    divider.setSplit(0.7);

    expect(body.style.getPropertyValue("--cherry-split")).toBe("70%");
    divider.destroy();
  });

  it("clamps split ratio", () => {
    const { body, divider } = createDividerTree();

    divider.setSplit(0.05);
    expect(body.style.getPropertyValue("--cherry-split")).toBe("15%");

    divider.setSplit(0.95);
    expect(body.style.getPropertyValue("--cherry-split")).toBe("85%");

    divider.destroy();
  });

  it("rejects invalid DOM placement", () => {
    document.body.innerHTML = `<div class="cherry-divider"></div>`;
    const mount = document.querySelector(".cherry-divider")! as HTMLElement;
    expect(() => new Divider(mount, new Theme())).toThrow(/必须位于/);
  });
});
