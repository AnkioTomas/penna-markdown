/**
 * HTML 属性追加命令。
 * 直接在选区后插入 Penna 扩展属性块 `{.className}`，并选中 className 以便直接输入。
 */
import type { EditorView } from "@codemirror/view";
import { EditorSelection } from "@codemirror/state";
import type { Command, CommandContext } from "@/editor/commands/Command";

export class HtmlAttrCommand implements Command {
  /**
   * 在选区末尾插入可编辑的 HTML 属性块并选中类名。
   * @param view - 要修改的 CodeMirror 编辑器实例
   * @param _payload - 未使用的命令参数
   * @param _ctx - 未使用的命令上下文
   * @returns 始终返回 true，表示已插入属性块
   */
  execute(view: EditorView, _payload: unknown, _ctx: CommandContext): boolean {
    const attr = "{.className}";
    const { from, to, empty } = view.state.selection.main;
    const insertAt = empty ? from : to;
    view.dispatch({
      changes: { from: insertAt, to: insertAt, insert: attr },
      // 选中 className，方便用户直接打字替换
      selection: EditorSelection.range(insertAt + 2, insertAt + 2 + 9),
      scrollIntoView: true,
    });
    return true;
  }
}

/** `htmlAttr` 命令实例 */
export const htmlAttrCommand = new HtmlAttrCommand();
