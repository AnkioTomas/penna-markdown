/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, afterEach } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { runCommand, applyHeading } from "@/editor/commands/index.js";
import { Theme } from "@/theme/Theme.js";

function createView(
  doc: string,
  selection?: { anchor: number; head?: number },
) {
  const parent = document.createElement("div");
  document.body.append(parent);
  const state = EditorState.create({
    doc,
    selection: selection
      ? { anchor: selection.anchor, head: selection.head ?? selection.anchor }
      : undefined,
  });
  return new EditorView({ state, parent });
}

describe("editor/commands", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("bold wraps selection", () => {
    const view = createView("hello world", { anchor: 0, head: 5 });
    runCommand(view, "bold");
    expect(view.state.doc.toString()).toBe("**hello** world");
    view.destroy();
  });

  it("heading1 converts line", () => {
    const view = createView("Title", { anchor: 0 });
    runCommand(view, "heading1");
    expect(view.state.doc.toString()).toBe("# Title");
    view.destroy();
  });

  it("heading1 applies to whole line when cursor is mid-line", () => {
    const view = createView("Title", { anchor: 3 });
    applyHeading(view, 1);
    expect(view.state.doc.toString()).toBe("# Title");
    view.destroy();
  });

  it("heading1 replaces existing heading prefix", () => {
    const view = createView("## Title", { anchor: 5 });
    runCommand(view, "heading1");
    expect(view.state.doc.toString()).toBe("# Title");
    view.destroy();
  });

  it("table inserts markdown after dialog result", async () => {
    const view = createView("");
    const theme = new Theme();
    theme.on("editor:dialog:open", (payload) => {
      const { id } = payload as { id: string };
      queueMicrotask(() => {
        theme.emit("editor:dialog:result", { id, data: { rows: 2, cols: 2 } });
      });
    });
    await runCommand(view, "table", undefined, { theme });
    expect(view.state.doc.toString()).toContain("| --- | --- |");
    view.destroy();
  });

  it("link inserts markdown after dialog result", async () => {
    const view = createView("");
    const theme = new Theme();
    theme.on("editor:dialog:open", (payload) => {
      const { id } = payload as { id: string };
      queueMicrotask(() => {
        theme.emit("editor:dialog:result", {
          id,
          data: { text: "Cherry", url: "https://example.com" },
        });
      });
    });
    await runCommand(view, "link", undefined, { theme });
    expect(view.state.doc.toString()).toBe("[Cherry](https://example.com)");
    view.destroy();
  });

  it("badge wraps selection without dialog", async () => {
    const view = createView("note", { anchor: 0, head: 4 });
    const theme = new Theme();
    const openSpy = vi.fn();
    theme.on("editor:dialog:open", openSpy);
    await runCommand(view, "badge", { variant: "tip" }, { theme });
    expect(view.state.doc.toString()).toBe("[note]{.tip}");
    expect(openSpy).not.toHaveBeenCalled();
    view.destroy();
  });

  it("alert inserts GFM admonition syntax", () => {
    const view = createView("");
    runCommand(view, "alert", { type: "TIP" });
    expect(view.state.doc.toString()).toBe("> [!TIP]\n> 提示内容\n");
    view.destroy();
  });

  it("container inserts triple-colon block", () => {
    const view = createView("");
    runCommand(view, "container", { type: "warning", title: "警告" });
    expect(view.state.doc.toString()).toBe("::: warning 警告\n容器内容\n:::\n");
    view.destroy();
  });

  it("comment wraps multiline selection per line", () => {
    const doc = "line one\nline two";
    const view = createView(doc, { anchor: 0, head: doc.length });
    runCommand(view, "comment");
    expect(view.state.doc.toString()).toBe("%%line one%%\n%%line two%%");
    view.destroy();
  });

  it("comment wraps single line with double percent", () => {
    const view = createView("note", { anchor: 0, head: 4 });
    runCommand(view, "comment");
    expect(view.state.doc.toString()).toBe("%%note%%");
    view.destroy();
  });

  it("badge opens dialog when selection is empty", async () => {
    const view = createView("");
    const theme = new Theme();
    theme.on("editor:dialog:open", (payload) => {
      const { id } = payload as { id: string };
      queueMicrotask(() => {
        theme.emit("editor:dialog:result", {
          id,
          data: { text: "new", variant: "warning" },
        });
      });
    });
    await runCommand(view, "badge", undefined, { theme });
    expect(view.state.doc.toString()).toBe("[new]{.warning}");
    view.destroy();
  });
});
