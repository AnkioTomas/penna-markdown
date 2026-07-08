/**
 * 标签页容器命令。
 * 废弃了复杂的填表式弹窗，直接在光标处插入 Markdown 语法。
 */
import type { EditorView } from "@codemirror/view";
import {
  Command,
  insertSnippet,
  type CommandContext,
} from "@/editor/commands/Command";

/** `tabs` — 插入多标签页容器 */
export class TabsCommand implements Command {
  execute(view: EditorView, _payload: unknown, _ctx: CommandContext): boolean {
    const state = view.state;
    const selection = state.selection.main;
    const selectedText = state.sliceDoc(selection.from, selection.to);
    const content = selectedText || "标签 1 内容";

    const snippet = `::: tabs\n\n@tab:active 标签 1\n\n${content}\n\n@tab 标签 2\n\n标签 2 内容\n\n:::\n`;

    insertSnippet(view, snippet);
    return true;
  }
}

export const tabsCommand = new TabsCommand();
