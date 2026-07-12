/**
 * 折叠面板命令组。
 * 废弃了复杂的填表式弹窗，直接在光标处插入 Markdown 语法。
 */
import type { EditorView } from "@codemirror/view";
import {
  Command,
  insertSnippet,
  type CommandContext,
} from "@/editor/commands/Command";

export type CollapseVariant = "default" | "expanded" | "expand";

export class CollapseCommand implements Command {
  /**
   * 创建固定折叠面板样式的命令。
   * @param variant - 手风琴或独立展开面板的输出变体
   */
  constructor(private readonly variant: CollapseVariant) {}

  /**
   * 用折叠面板模板包裹选区，或插入默认面板内容。
   * @param view - 要修改的 CodeMirror 编辑器实例
   * @param _payload - 未使用的命令参数
   * @param _ctx - 未使用的命令上下文
   * @returns 始终返回 true，表示已插入面板模板
   */
  execute(view: EditorView, _payload: unknown, _ctx: CommandContext): boolean {
    const state = view.state;
    const selection = state.selection.main;
    const selectedText = state.sliceDoc(selection.from, selection.to);
    const content = selectedText || "面板内容";
    const indentedContent = content.replace(/\n/g, "\n  ");

    let snippet = "";
    if (this.variant === "default") {
      snippet = `::: collapse accordion\n- 手风琴 A\n\n  ${indentedContent}\n\n- 手风琴 B\n\n  面板内容\n:::\n`;
    } else if (this.variant === "expanded") {
      snippet = `::: collapse accordion\n- :+ 手风琴 A\n\n  ${indentedContent}\n\n- 手风琴 B\n\n  面板内容\n:::\n`;
    } else if (this.variant === "expand") {
      snippet = `::: collapse expand\n- 面板 A\n\n  ${indentedContent}\n\n- :- 面板 B\n\n  面板内容\n:::\n`;
    }

    insertSnippet(view, snippet);
    return true;
  }
}

/** `collapseDefault` — 手风琴，默认折叠 */
export const collapseDefaultCommand = new CollapseCommand("default");
/** `collapseExpanded` — 手风琴，首面板默认展开（:+） */
export const collapseExpandedCommand = new CollapseCommand("expanded");
/** `collapseExpand` — 多面板独立展开（expand 模式） */
export const collapseExpandCommand = new CollapseCommand("expand");
