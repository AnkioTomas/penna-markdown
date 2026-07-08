/**
 * 代码片段插入命令。
 * 将预定义的 Markdown 模板插入编辑器，可选中模板内的占位区间。
 */
import type { EditorView } from "@codemirror/view";
import { Command, insertSnippet } from "@/editor/commands/Command";

export class SnippetCommand implements Command {
  /**
   * @param snippet - 要插入的 Markdown 文本
   * @param selectFrom - 插入后选区起始（相对 snippet 开头）
   * @param selectEnd - 插入后选区结束（相对 snippet 开头）
   */
  constructor(
    private snippet: string,
    private selectFrom?: number,
    private selectEnd?: number,
  ) {}

  execute(view: EditorView): boolean {
    insertSnippet(view, this.snippet, this.selectFrom, this.selectEnd);
    return true;
  }
}
