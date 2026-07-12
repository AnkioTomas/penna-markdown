/**
 * 步骤条容器命令。
 * 废弃了复杂的填表式弹窗，直接在光标处插入 Markdown 语法。
 */
import type { EditorView } from "@codemirror/view";
import {
  Command,
  insertSnippet,
  type CommandContext,
} from "@/editor/commands/Command";

/** `steps` — 插入步骤引导容器 */
export class StepsCommand implements Command {
  /**
   * 用步骤条模板包裹选区，或插入默认的两个步骤。
   * @param view - 要修改的 CodeMirror 编辑器实例
   * @param _payload - 未使用的命令参数
   * @param _ctx - 未使用的命令上下文
   * @returns 始终返回 true，表示已插入步骤条
   */
  execute(view: EditorView, _payload: unknown, _ctx: CommandContext): boolean {
    const state = view.state;
    const selection = state.selection.main;
    const selectedText = state.sliceDoc(selection.from, selection.to);

    // 如果有选中的文本，将其作为步骤一的说明内容，并处理缩进
    const step1Content = selectedText
      ? selectedText.replace(/\n/g, "\n   ")
      : "步骤 1 说明";

    const snippet = `::: steps\n\n1. 步骤一\n\n   ${step1Content}\n\n2. 步骤二\n\n   步骤 2 说明\n\n:::\n`;

    insertSnippet(view, snippet);
    return true;
  }
}

export const stepsCommand = new StepsCommand();
