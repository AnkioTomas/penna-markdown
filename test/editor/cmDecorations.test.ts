/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { buildHighlightDecorations, createTransformerHighlightExtension } from "@/editor/cmDecorations.js";

describe("cmDecorations", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("buildHighlightDecorations marks highlight syntax", () => {
    const md = "==marked==";
    const deco = buildHighlightDecorations(md);
    const iter = deco.iter();
    expect(iter.value).not.toBeNull();
    expect(iter.value!.spec.class).toBe("cm-ext-highlight");
    expect(iter.from).toBe(0);
    expect(iter.to).toBe(md.length);
  });

  it("createTransformerHighlightExtension applies decorations on mount and debounced edits", () => {
    const parent = document.createElement("div");
    document.body.append(parent);

    const view = new EditorView({
      state: EditorState.create({
        doc: "==debounced==",
        extensions: [createTransformerHighlightExtension({ debounceMs: 50 })],
      }),
      parent,
    });

    expect(view.dom.querySelector(".cm-ext-highlight")).toBeTruthy();

    view.dispatch({ changes: { from: 0, to: 0, insert: "x" } });
    vi.advanceTimersByTime(50);
    expect(view.dom.querySelector(".cm-ext-highlight")).toBeTruthy();

    view.destroy();
    parent.remove();
  });
});
