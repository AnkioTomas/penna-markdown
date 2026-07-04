import type { Extension } from "@codemirror/state";
import { StateEffect, StateField } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import {
  collectHighlightSpans,
  type HighlightSpanOptions,
} from "./highlightSpans";

export interface TransformerHighlightOptions extends HighlightSpanOptions {
  debounceMs?: number;
}

export function buildHighlightDecorations(
  markdown: string,
  options?: HighlightSpanOptions,
): DecorationSet {
  const spans = collectHighlightSpans(markdown, options);
  const marks = spans.map((span) =>
    Decoration.mark({ class: span.class }).range(span.from, span.to),
  );
  return Decoration.set(marks, true);
}

const setTransformerDecorations = StateEffect.define<DecorationSet>();

function createDecorationField(options: TransformerHighlightOptions) {
  return StateField.define<DecorationSet>({
    create(state) {
      return buildHighlightDecorations(state.doc.toString(), options);
    },
    update(decorations, tr) {
      decorations = decorations.map(tr.changes);
      for (const effect of tr.effects) {
        if (effect.is(setTransformerDecorations)) {
          decorations = effect.value;
        }
      }
      return decorations;
    },
    provide: (field) => EditorView.decorations.from(field),
  });
}

class TransformerHighlightPlugin {
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly view: EditorView,
    private readonly options: TransformerHighlightOptions,
  ) {}

  update(update: ViewUpdate): void {
    if (update.docChanged) {
      this.schedule();
    }
  }

  destroy(): void {
    if (this.timer) clearTimeout(this.timer);
  }

  private schedule(): void {
    if (this.timer) clearTimeout(this.timer);
    const debounceMs = this.options.debounceMs ?? 80;
    this.timer = setTimeout(() => this.applyNow(), debounceMs);
  }

  private applyNow(): void {
    const deco = buildHighlightDecorations(
      this.view.state.doc.toString(),
      this.options,
    );
    this.view.dispatch({
      effects: setTransformerDecorations.of(deco),
    });
  }
}

/** transformer 驱动的 Cherry 扩展语法 decoration 高亮 */
export function createTransformerHighlightExtension(
  options: TransformerHighlightOptions = {},
): Extension {
  return [
    createDecorationField(options),
    ViewPlugin.define((view) => new TransformerHighlightPlugin(view, options)),
  ];
}
