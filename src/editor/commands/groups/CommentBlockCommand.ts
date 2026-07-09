/**
 * 块级注释命令。
 * 支持选中区块进行注释或取消注释。
 */
import type { EditorView } from "@codemirror/view";
import { Command, toggleInlineWrap } from "@/editor/commands/Command";

export class CommentBlockCommand implements Command {
  execute(view: EditorView): boolean {
    toggleInlineWrap(view, "%%%\n", "\n%%%", "注释");
    return true;
  }
}

/**
 * `commentBlock` — 块级注释（预览隐藏）。
 * 语法：`%%%\n...\n%%%`
 */
export const commentBlockCommand = new CommentBlockCommand();
