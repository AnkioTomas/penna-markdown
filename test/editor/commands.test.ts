/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { runCommand } from "@/editor/commands.js";

function createView(doc: string, selection?: { anchor: number; head?: number }) {
  const parent = document.createElement("div");
  document.body.append(parent);
  const state = EditorState.create({
    doc,
    selection: selection ? { anchor: selection.anchor, head: selection.head ?? selection.anchor } : undefined,
  });
  return new EditorView({ state, parent });
}

describe.skip("editor/commands", () => {
  afterEach(() => { document.body.innerHTML = ""; });

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
});
