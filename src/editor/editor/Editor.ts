import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { markdown, markdownKeymap, markdownLanguage } from "@codemirror/lang-markdown";
import { EditorState, type Extension } from "@codemirror/state";
import {
  EditorView,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import { createEditorSyntaxHighlighting } from "./cmSyntax";
import { CherryInlinesExtension, CherryMathBlockExtension, codeInfoPlugin } from "./lezer";
import type { EditorOptions } from "./EditorOptions";
import type { Theme } from "@/theme/Theme";





/**
 * 编辑器核心类，是对 CodeMirror 6 的一层防腐层（Anti-Corruption Layer）封装。
 * 
 * 【架构说明】
 * 为什么要包这一层？
 * 1. 隔离外部依赖：整个项目中，除了 `src/editor/editor` 目录下的几个文件外，
 *    其他任何业务模块都不应该直接引用 `@codemirror/*` 里的 API。
 * 2. 对接事件总线：这个类内部将 CodeMirror 的 `updateListener` 转译为我们的 `theme.emit("editor:change")` 事件。
 * 3. 动态扩展高亮绑定：在初始化时，会调用 `resolveTransformerHighlight` 把基于 Transformer 的 AST
 *    高亮同步扩展动态打入 CodeMirror 中。
 */
export class Editor {
  private readonly view: EditorView;

  constructor(mount: HTMLElement, theme: Theme, options: EditorOptions) {
    mount.classList.add("cherry-editor-cm");

    const lineNumbersEnabled = options.lineNumbers !== false;

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
      markdown({
        base: markdownLanguage,
        extensions: [CherryMathBlockExtension, CherryInlinesExtension],
      }),
      createEditorSyntaxHighlighting(),
      codeInfoPlugin,
      updateListener,
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



  focus(): void {
    this.view.focus();
  }

  destroy(): void {
    this.view.destroy();
  }
}
