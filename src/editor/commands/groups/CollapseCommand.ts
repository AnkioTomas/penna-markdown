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

/** 用 `@item` 分隔面板，正文无需缩进，可直接容纳列表、代码块等复杂内容。 */
function buildSnippet(variant: CollapseVariant, content: string): string {
  switch (variant) {
    case "expanded":
      return `::: collapse accordion\n@item:open 手风琴 A\n${content}\n@item 手风琴 B\n面板内容\n:::\n`;
    case "expand":
      return `::: collapse expand\n@item 面板 A\n${content}\n@item:closed 面板 B\n面板内容\n:::\n`;
    default:
      return `::: collapse accordion\n@item 手风琴 A\n${content}\n@item 手风琴 B\n面板内容\n:::\n`;
  }
}

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
    const selection = view.state.selection.main;
    const content =
      view.state.sliceDoc(selection.from, selection.to) || "面板内容";

    insertSnippet(view, buildSnippet(this.variant, content));
    return true;
  }
}

/** `collapseDefault` — 手风琴，默认折叠 */
export const collapseDefaultCommand = new CollapseCommand("default");
/** `collapseExpanded` — 手风琴，首面板默认展开（@item:open） */
export const collapseExpandedCommand = new CollapseCommand("expanded");
/** `collapseExpand` — 多面板独立展开（expand 模式） */
export const collapseExpandCommand = new CollapseCommand("expand");
