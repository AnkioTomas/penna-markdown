/**
 * 水平分割线命令。
 * 在光标处插入 GFM 水平线 `\n---\n`。
 */
import type { EditorView } from "@codemirror/view";
import { Command, insertSnippet } from "@/editor/commands/Command";

class HorizontalRuleCommand implements Command {
  execute(view: EditorView): boolean {
    insertSnippet(view, "---\n", 4);
    return true;
  }
}

/** `horizontalRule` — 插入水平分割线 `---` */
export const horizontalRuleCommand = new HorizontalRuleCommand();
