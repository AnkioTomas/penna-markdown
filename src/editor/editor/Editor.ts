import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { markdown, markdownKeymap } from "@codemirror/lang-markdown";
import { EditorState, type Extension } from "@codemirror/state";
import {
  EditorView,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import { createTransformerHighlightExtension } from "./cmDecorations";
import {
  createEditorSyntaxHighlighting,
  type EditorCustomTagHighlight,
} from "./cmSyntax";
import type { EditorOptions } from "./EditorOptions";
import type { Theme } from "@/theme/Theme";

function normalizeExtensions(extensions: Extension | Extension[] = []): Extension[] {
  return Array.isArray(extensions) ? extensions : [extensions];
}

function resolveTransformerHighlight(options: EditorOptions): Extension[] {
  if (options.transformerHighlight === false) return [];
  const highlightOpts =
    typeof options.transformerHighlight === "object"
      ? options.transformerHighlight
      : {};
  return [
    createTransformerHighlightExtension({
      ...highlightOpts,
      transformerEngineOptions:
        highlightOpts.transformerEngineOptions ?? options.transformerEngineOptions,
    }),
  ];
}

export class Editor {
  private readonly view: EditorView;

  constructor(mount: HTMLElement, theme: Theme, options: EditorOptions) {
    mount.classList.add("cherry-editor-cm");

    const lineNumbersEnabled = options.lineNumbers !== false;
    const customTags = options.customTagHighlights ?? [];

    const updateListener = EditorView.updateListener.of((update) => {
      if (!update.docChanged) return;
      const payload = {
        markdown: update.state.doc.toString(),
        tr: update.transactions,
      };
      theme.emit("editor:change", payload);
    });

    const extensions: Extension[] = [
      history(),
      EditorView.lineWrapping,
      keymap.of([
        ...markdownKeymap,
        ...defaultKeymap,
        ...historyKeymap,
        indentWithTab,
      ]),
      markdown(),
      createEditorSyntaxHighlighting(customTags),
      ...resolveTransformerHighlight(options),
      updateListener,
      ...normalizeExtensions(options.extensions),
    ];

    if (lineNumbersEnabled) {
      extensions.push(lineNumbers(), highlightActiveLineGutter());
    }

    const state = EditorState.create({
      doc: options.value ?? "",
      extensions,
    });

    this.view = new EditorView({ state, parent: mount });
  }

  getMarkdown(): string {
    return this.view.state.doc.toString();
  }

  setMarkdown(markdownText: string): void {
    const current = this.getMarkdown();
    if (current === markdownText) return;
    this.view.dispatch({
      changes: { from: 0, to: current.length, insert: markdownText },
    });
  }

  getView(): EditorView {
    return this.view;
  }

  getScrollDOM(): HTMLElement {
    return this.view.scrollDOM;
  }

  getCustomTagHighlights(): EditorCustomTagHighlight[] {
    return [];
  }

  setCustomTagHighlights(_highlights: EditorCustomTagHighlight[]): void {
    // 动态切换需重建 EditorView，后续按需实现
  }

  focus(): void {
    this.view.focus();
  }

  destroy(): void {
    this.view.destroy();
  }
}
