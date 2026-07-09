/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, afterEach } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { runCommand } from "@/editor/commands/index.js";
import { codeBlockMarkdown } from "@/editor/commands/groups/CodeBlockCommand";
import { cardMarkdown } from "@/editor/commands/groups/CardCommand.js";
import { fieldMarkdown } from "@/editor/commands/groups/FieldCommand.js";
import { mermaidMarkdown } from "@/editor/commands/groups/MermaidCommand.js";
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
    runCommand(view, "heading1");
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

  it("alertTip inserts GFM admonition after dialog result", async () => {
    const view = createView("");
    const theme = new Theme();
    theme.on("editor:dialog:open", (payload) => {
      const { id } = payload as { id: string };
      queueMicrotask(() => {
        theme.emit("editor:dialog:result", {
          id,
          data: { kind: "TIP", content: "提示内容" },
        });
      });
    });
    await runCommand(view, "alertTip", undefined, { theme });
    expect(view.state.doc.toString()).toBe("> [!TIP]\n> 提示内容\n");
    view.destroy();
  });

  it("containerWarning inserts triple-colon block after dialog result", async () => {
    const view = createView("");
    const theme = new Theme();
    theme.on("editor:dialog:open", (payload) => {
      const { id } = payload as { id: string };
      queueMicrotask(() => {
        theme.emit("editor:dialog:result", {
          id,
          data: { type: "warning", title: "警告", content: "容器内容" },
        });
      });
    });
    await runCommand(view, "containerWarning", undefined, { theme });
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

  it("card inserts markdown after dialog result", async () => {
    const view = createView("");
    const theme = new Theme();
    theme.on("editor:dialog:open", (payload) => {
      const { id } = payload as { id: string };
      queueMicrotask(() => {
        theme.emit("editor:dialog:result", {
          id,
          data: {
            variant: "basic",
            title: "标题",
            content: "正文",
          },
        });
      });
    });
    await runCommand(view, "card", undefined, { theme });
    expect(view.state.doc.toString()).toBe("::: card 标题\n正文\n:::\n");
    view.destroy();
  });
});

describe("codeBlockMarkdown", () => {
  it("collapse variant emits :collapsed-lines=N", () => {
    const md = codeBlockMarkdown({
      variant: "collapse",
      lang: "css",
      code: "a {}\nb {}",
      collapsedMaxLines: 5,
    });
    expect(md).toBe("```css :collapsed-lines=5\na {}\nb {}\n```\n");
  });
});

describe("cardMarkdown", () => {
  it("link variant emits link and icon attrs", () => {
    const md = cardMarkdown({
      variant: "link",
      title: "文档",
      link: "https://example.com",
      icon: "https://example.com/icon.png",
      content: "描述",
    });
    expect(md).toBe(
      '::: link-card 文档 link="https://example.com" icon="https://example.com/icon.png"\n描述\n:::\n',
    );
  });

  it("image variant emits metadata attrs", () => {
    const md = cardMarkdown({
      variant: "image",
      image: "https://example.com/a.webp",
      title: "灯塔",
      href: "/",
      author: "Alice",
      date: "2024/01/01",
      description: "海边",
    });
    expect(md).toContain('image="https://example.com/a.webp"');
    expect(md).toContain('title="灯塔"');
    expect(md).toContain('author="Alice"');
    expect(md).toContain('description="海边"');
  });

  it("grid variant emits responsive cols and child cards", () => {
    const md = cardMarkdown({
      variant: "grid",
      colsMode: "responsive",
      colsSm: 1,
      colsMd: 2,
      colsLg: 3,
      items: [
        { title: "A", content: "一" },
        { title: "B", content: "二" },
      ],
    });
    expect(md).toContain(':::: card-grid cols="{ sm: 1, md: 2, lg: 3 }"');
    expect(md).toContain("::: card A\n一\n:::");
    expect(md).toContain("::: card B\n二\n:::");
  });

  it("masonry images mode emits image list", () => {
    const md = cardMarkdown({
      variant: "masonry",
      cols: 3,
      gap: 16,
      mode: "images",
      imageUrls: ["https://example.com/1.png", "https://example.com/2.png"],
    });
    expect(md).toContain(':::: card-masonry cols="3" gap="16"');
    expect(md).toContain("![ ](https://example.com/1.png)");
    expect(md).toContain("![ ](https://example.com/2.png)");
  });
});

describe("fieldMarkdown", () => {
  it("basic field emits directives", () => {
    const md = fieldMarkdown({
      variant: "basic",
      name: "theme",
      fieldType: "ThemeConfig",
      status: "required",
      defaultValue: "{ base: '/' }",
      description: "主题配置",
    });
    expect(md).toContain("::: field theme");
    expect(md).toContain("@type ThemeConfig");
    expect(md).toContain("@required");
    expect(md).toContain("@default { base: '/' }");
  });
});

describe("mermaidMarkdown", () => {
  it("emits max-width info string", () => {
    const md = mermaidMarkdown({
      variant: "flow",
      source: "flowchart TD\n  A --> B",
      maxWidth: "640",
    });
    expect(md).toBe("```mermaid max-width=640\nflowchart TD\n  A --> B\n```\n");
  });
});
