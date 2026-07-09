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
