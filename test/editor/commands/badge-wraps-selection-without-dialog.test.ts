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
