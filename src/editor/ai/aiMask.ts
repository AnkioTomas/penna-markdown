import { EditorState } from "@codemirror/state";
import { EditorView, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import { aiStateField, isAITransaction } from "./aiState";
import { rejectDiffSnapshot } from "./aiDiff";

/** 生成中时禁止编辑 */
export const aiGeneratingReadOnly = EditorState.readOnly.compute(
  [aiStateField],
  (state) => state.field(aiStateField).phase === "generating",
);

export const aiMaskPlugin = ViewPlugin.fromClass(
  class {
    mask: HTMLElement | null = null;

    constructor(readonly view: EditorView) {
      this.sync(view);
    }

    update(update: ViewUpdate) {
      const prev = update.startState.field(aiStateField);
      const curr = update.state.field(aiStateField);

      if (
        prev.phase === "diff" &&
        curr.phase === "idle" &&
        update.docChanged &&
        update.transactions.some((tr) => !isAITransaction(tr))
      ) {
        const snapshot = prev;
        queueMicrotask(() => rejectDiffSnapshot(this.view, snapshot));
      }

      if (prev !== curr) {
        this.sync(update.view);
      }
    }

    sync(view: EditorView) {
      const generating = view.state.field(aiStateField).phase === "generating";

      if (generating && !this.mask) {
        const mask = document.createElement("div");
        mask.className = "cherry-ai-mask";
        mask.setAttribute("aria-busy", "true");

        const spinner = document.createElement("div");
        spinner.className = "cherry-ai-mask-spinner";
        mask.appendChild(spinner);

        view.dom.appendChild(mask);
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
