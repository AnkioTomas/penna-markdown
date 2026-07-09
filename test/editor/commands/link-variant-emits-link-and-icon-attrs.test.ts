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
