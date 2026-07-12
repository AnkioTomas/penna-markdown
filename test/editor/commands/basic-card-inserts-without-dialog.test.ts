/**
 * @vitest-environment jsdom
 */

import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { expect, it } from "vitest";
import { runCommand } from "@/editor/commands/index.js";

it("inserts a basic card directly", async () => {
  const view = new EditorView({
    state: EditorState.create({
      doc: "selected",
      selection: { anchor: 0, head: "selected".length },
    }),
    parent: document.body,
  });

  await expect(runCommand(view, "card")).resolves.toBe(true);
  expect(view.state.doc.toString()).toBe("::: card 卡片标题\nselected\n:::\n");
  view.destroy();
});
