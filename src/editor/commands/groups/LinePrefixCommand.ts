/**
 * 行首前缀命令组。
 * 为当前行设置固定前缀（引用、列表等），会剥离已有标题前缀。
 */
import type { EditorView } from "@codemirror/view";
import { Command, setLinePrefix } from "@/editor/commands/Command";

export class LinePrefixCommand implements Command {
  /**
   * @param prefix - 行首前缀字符串，或根据 payload 动态生成的函数
   */
  constructor(private prefix: string | ((payload: unknown) => string)) {}

  /**
   * 解析固定或动态前缀并设置到当前行。
   * @param view - 要修改的 CodeMirror 编辑器实例
   * @param payload - 动态前缀函数的输入参数
   * @returns 行首前缀设置结果
   */
  execute(view: EditorView, payload: unknown): boolean {
    const pref =
      typeof this.prefix === "function" ? this.prefix(payload) : this.prefix;
    return setLinePrefix(view, pref);
  }
}

/** `blockquote` — 引用块，行首加 `> ` */
export const blockquoteCommand = new LinePrefixCommand("> ");
/** `unorderedList` — 无序列表，行首加 `- ` */
export const unorderedListCommand = new LinePrefixCommand("- ");
/** `orderedList` — 有序列表，行首加 `1. ` */
export const orderedListCommand = new LinePrefixCommand("1. ");
