/**
 * @vitest-environment jsdom
 */

import { expect, it, vi } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { runCommand } from "@/editor/commands/index.js";
import { codeBlockMarkdown } from "@/editor/commands/groups/CodeBlockCommand";
import { cardMarkdown } from "@/editor/commands/groups/CardCommand.js";
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
