/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Cherry } from "@/editor/Cherry";

function createCherry(options: Parameters<typeof Cherry>[1] = {}) {
  const mount = document.getElementById("cherry-editor")!;
  return new Cherry(mount, options);
}

describe("Cherry", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="cherry-editor"></div>';
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("creates with split layout by default", () => {
    const cherry = createCherry({
      id: "cherry-editor",
      editor: { value: "# Hello\n\nWorld" },
    });

    expect(document.querySelector(".cherry-body--split")).toBeTruthy();
    expect(cherry.getLayout()).toBe("split");
    expect(cherry.getMarkdown()).toBe("# Hello\n\nWorld");
    expect(document.querySelector(".cherry")).toBeTruthy();
    expect(document.querySelector(".cherry-preview")).toBeTruthy();
    expect(cherry.theme.getTheme().id).toBe("default");

    cherry.destroy();
  });

  it("setLayout switches to edit-only", () => {
    const handler = vi.fn();
    const cherry = createCherry({
      id: "cherry-editor",
      editor: { value: "test" },
    });
    cherry.theme.on("editor:layout", handler);

    cherry.setLayout("edit");

    expect(cherry.getLayout()).toBe("edit");
    expect(document.querySelector(".cherry-body--edit")).toBeTruthy();
    expect(handler).toHaveBeenCalledWith({ mode: "edit", prev: "split" });

    cherry.destroy();
  });

  it("setMarkdown emits editor:change", () => {
    const handler = vi.fn();
    const cherry = createCherry({
      id: "cherry-editor",
      editor: { value: "a" },
    });
    cherry.theme.on("editor:change", handler);
    handler.mockClear();

    cherry.setMarkdown("b");

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ markdown: "b" }),
    );
    cherry.destroy();
  });

  it("emits editor:ready on mount", async () => {
    const handler = vi.fn();
    const cherry = createCherry({ id: "cherry-editor" });
    cherry.theme.on("editor:ready", handler);

    await Promise.resolve();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].id).toBe("cherry-editor");

    cherry.destroy();
  });

  it("renders preview on editor:change", () => {
    const cherry = createCherry({
      editor: { value: "# Title" },
    });

    const preview = document.querySelector(".cherry-preview")!;
    expect(preview.innerHTML.length).toBeGreaterThan(0);

    cherry.destroy();
  });
});
