import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import { search, searchKeymap } from "@codemirror/search";
import {
  markdown,
  markdownKeymap,
  markdownLanguage,
} from "@codemirror/lang-markdown";
import { EditorState, type Extension } from "@codemirror/state";
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  drawSelection,
} from "@codemirror/view";
import { createEditorSyntaxHighlighting } from "./cmSyntax";
import {
  CherryInlinesExtension,
  CherryMathBlockExtension,
  CherryCommentBlockExtension,
  codeInfoPlugin,
} from "@/editor/editor/lezer";
import { clipboardExtension } from "./clipboard";
import { pasteStateField, pasteTooltipPlugin } from "./pasteTooltip";
import { createCustomSearchPanel } from "./searchPanel";
import { createAIExtension } from "@/editor/ai";
import type { EditorChangePayload } from "@/editor/events";
import type { EditorOptions } from "./EditorOptions";
import type { EventBus } from "@/core/event/EventBus";

/**
 * 编辑器核心：组装 CodeMirror 6 扩展，并把文档变更翻译为 `editor:change`。
 *
 * 【CM 依赖边界（诚实声明）】
 * 允许直接依赖 `@codemirror/*` 的目录：
 *   - `src/editor/editor/**`
 *   - `src/editor/commands/**`
 *   - `src/editor/ai/**`
 *   - `src/editor/CommandBridge.ts`（仅获取 EditorView）
 * 禁止：toolbar / sidebar / statusbar / dialog / divider / preview 不得 import `@codemirror/*`。
 */
export class Editor {
  private readonly view: EditorView;

  /**
   * 创建 CodeMirror 编辑器并注册文档变更与 AI 命令监听。
   *
   * @param mount 编辑器 DOM 挂载容器。
   * @param eventBus 供编辑器向外发布事件的共享事件总线。
   * @param options 编辑器初始内容、扩展功能及外部依赖配置。
   */
  constructor(mount: HTMLElement, eventBus: EventBus, options: EditorOptions) {
    mount.classList.add("cherry-editor-cm");

    const lineNumbersEnabled = options.lineNumbers !== false;

    const updateListener = EditorView.updateListener.of((update) => {
      if (!update.docChanged) return;
      const payload: EditorChangePayload = {
        markdown: update.state.doc.toString(),
        tr: update.transactions,
      };
      eventBus.emit("editor:change", payload);
    });

    const extensions: Extension[] = [
      history(),
      EditorView.lineWrapping,
      keymap.of([
        ...markdownKeymap,
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
        indentWithTab,
      ]),
      markdown({
        base: markdownLanguage,
        extensions: [
          CherryMathBlockExtension,
          CherryCommentBlockExtension,
          CherryInlinesExtension,
        ],
      }),
      createEditorSyntaxHighlighting(),
      codeInfoPlugin,
      updateListener,
      clipboardExtension(options.onParseFile),
      pasteStateField,
      pasteTooltipPlugin,
      search({ top: true, createPanel: createCustomSearchPanel }), // Show search panel at the top
    ];

    if (lineNumbersEnabled) {
      extensions.push(lineNumbers(), highlightActiveLineGutter());
    }

    extensions.push(highlightActiveLine(), drawSelection());

    if (options.onAiRequest) {
      extensions.push(...createAIExtension());
    }

    const state = EditorState.create({
      doc: options.value ?? "",
      extensions,
    });

    this.view = new EditorView({ state, parent: mount });
  }

  /** 获取当前文档的完整 Markdown 文本。 */
  getMarkdown(): string {
    return this.view.state.doc.toString();
  }

  /**
   * 用给定 Markdown 替换整个编辑器文档。
   *
   * @param markdownText 要写入编辑器的 Markdown 文本。
   */
  setMarkdown(markdownText: string): void {
    const current = this.getMarkdown();
    if (current === markdownText) return;
    this.view.dispatch({
      changes: { from: 0, to: current.length, insert: markdownText },
    });
  }

  /** 获取底层 CodeMirror 视图，供受控集成使用。 */
  getView(): EditorView {
    return this.view;
  }

  /** 获取负责编辑器滚动的 DOM 元素。 */
  getScrollDOM(): HTMLElement {
    return this.view.scrollDOM;
  }

  /** 将焦点移入底层 CodeMirror 编辑器。 */
  focus(): void {
    this.view.focus();
  }

  /** 销毁底层 CodeMirror 视图。 */
  destroy(): void {
    this.view.destroy();
  }
}
