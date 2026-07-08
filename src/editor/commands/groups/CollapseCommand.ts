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

export type CollapseVariant = "default" | "expanded" | "custom";

export class CollapseCommand implements Command {
  constructor(private readonly variant: CollapseVariant) {}

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
    } else {
      snippet = `::: collapse\n- 折叠标题\n\n  ${indentedContent}\n:::\n`;
    }

    insertSnippet(view, snippet);
    return true;
  }
}

/** `collapseDefault` — 手风琴，默认折叠 */
export const collapseDefaultCommand = new CollapseCommand("default");
/** `collapseExpanded` — 手风琴，首面板默认展开（:+） */
export const collapseExpandedCommand = new CollapseCommand("expanded");
/** `collapseCustom` — 自定义折叠/手风琴 */
export const collapseCustomCommand = new CollapseCommand("custom");
