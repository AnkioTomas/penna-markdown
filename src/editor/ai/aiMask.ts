import { EditorState } from "@codemirror/state";
import { EditorView, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import { aiStateField, isAILocked } from "./aiState";

export const aiLockedReadOnly = EditorState.readOnly.compute(
  [aiStateField],
  (state) => isAILocked(state.field(aiStateField)),
);

export const aiMaskPlugin = ViewPlugin.fromClass(
  class {
    mask: HTMLElement | null = null;

    constructor(readonly view: EditorView) {
      this.sync();
    }

    update(update: ViewUpdate) {
      const prev = update.startState.field(aiStateField);
      const curr = update.state.field(aiStateField);
      if (prev !== curr) this.sync();
    }

    sync() {
      const generating =
        this.view.state.field(aiStateField).phase === "generating";

      if (generating && !this.mask) {
        const mask = document.createElement("div");
        mask.className = "cherry-ai-mask";
        mask.setAttribute("aria-busy", "true");
        const spinner = document.createElement("div");
        spinner.className = "cherry-ai-mask-spinner";
        mask.appendChild(spinner);
        this.view.dom.appendChild(mask);
        this.mask = mask;
      } else if (!generating && this.mask) {
        this.mask.remove();
        this.mask = null;
      }
    }

    destroy() {
      this.mask?.remove();
      this.mask = null;
    }
  },
);
