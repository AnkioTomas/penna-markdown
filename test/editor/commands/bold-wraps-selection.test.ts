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

it("bold wraps selection", () => {
  const view = createView("hello world", { anchor: 0, head: 5 });
  runCommand(view, "bold");
  expect(view.state.doc.toString()).toBe("**hello** world");
  view.destroy();
});
