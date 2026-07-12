import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { createTestTheme } from "../../_helpers/busTheme";

export function createCommandView(
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

export function createCommandContext() {
  const { theme, eventBus } = createTestTheme();
  return { theme, eventBus, ctx: { eventBus, theme } };
}
