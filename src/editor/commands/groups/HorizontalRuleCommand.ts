/**
 * 水平分割线命令。
 * 在光标处插入 GFM 水平线 `\n---\n`。
 */
import type { EditorView } from "@codemirror/view";
import { Command, insertSnippet } from "@/editor/commands/Command";

class HorizontalRuleCommand implements Command {
  /**
   * 在当前选区处插入 GFM 水平分割线。
   * @param view - 要修改的 CodeMirror 编辑器实例
   * @returns 始终返回 true，表示已插入分割线
   */
  execute(view: EditorView): boolean {
    insertSnippet(view, "---\n", 4);
    return true;
  }
}

/** `horizontalRule` — 插入水平分割线 `---` */
export const horizontalRuleCommand = new HorizontalRuleCommand();
