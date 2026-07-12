import { EditorState } from "@codemirror/state";
import { expect, it } from "vitest";
import {
  aiDiffDecorations,
  aiStateField,
  buildHunks,
  setAIState,
} from "@/editor/ai";

it("shows diff decorations when entering diff phase in the same transaction", () => {
  const original = "line1\nline2\nline3\n";
  const doc = `before\n${original}after`;
  const from = doc.indexOf(original);
  const to = from + original.length;
  const result = "line1\nline2-mod\nline3\n";

  const state = EditorState.create({
    doc,
    extensions: [aiStateField, aiDiffDecorations],
  });

  const hunks = buildHunks(original, result, from);
  const next = state.update({
    changes: { from, to, insert: result },
    effects: setAIState.of({ phase: "diff", hunks }),
  });

  expect(next.state.field(aiStateField).phase).toBe("diff");
  expect(next.state.field(aiDiffDecorations).size).toBeGreaterThan(0);
  expect(hunks.length).toBe(1);
});
