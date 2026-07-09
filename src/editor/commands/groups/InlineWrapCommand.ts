/**
 * 行内标记命令组。
 * 对选区 toggle 包裹语法，再次执行可取消标记。
 */
import type { EditorView } from "@codemirror/view";
import {
  Command,
  toggleInlinePerLine,
  toggleInlineWrap,
} from "@/editor/commands/Command";

class InlineWrapCommand implements Command {
  /**
   * @param before - 起始标记，如 `**`
   * @param after - 结束标记，如 `**`
   * @param placeholder - 空选区时的占位文本
   * @param perLine - true 时多行选区逐行 toggle（用于行内注释等）
   */
  constructor(
    private before: string,
    private after: string,
    private placeholder = "",
    private perLine = false,
  ) {}

  execute(view: EditorView): boolean {
    if (this.perLine) {
      toggleInlinePerLine(view, this.before, this.after, this.placeholder);
    } else {
      toggleInlineWrap(view, this.before, this.after, this.placeholder);
    }
    return true;
  }
}

/** `bold` — 加粗，语法 `**文本**` */
export const boldCommand = new InlineWrapCommand("**", "**", "文本");
/** `italic` — 斜体，语法 `*文本*` */
export const italicCommand = new InlineWrapCommand("*", "*", "文本");
/** `strikethrough` — 删除线，语法 `~~文本~~` */
export const strikethroughCommand = new InlineWrapCommand("~~", "~~", "文本");
/** `code` — 行内代码，语法 `` `code` `` */
export const codeCommand = new InlineWrapCommand("`", "`", "code");
/** `highlight` — 高亮，语法 `==文本==` */
export const highlightCommand = new InlineWrapCommand("==", "==", "高亮");
export const highlightNoteCommand = new InlineWrapCommand(
  "==",
  "=={.note}",
  "高亮",
);
export const highlightTipCommand = new InlineWrapCommand(
  "==",
  "=={.tip}",
  "高亮",
);
export const highlightWarningCommand = new InlineWrapCommand(
  "==",
  "=={.warning}",
  "高亮",
);
export const highlightCautionCommand = new InlineWrapCommand(
  "==",
  "=={.caution}",
  "高亮",
);
export const highlightDangerCommand = new InlineWrapCommand(
  "==",
  "=={.danger}",
  "高亮",
);
export const highlightImportantCommand = new InlineWrapCommand(
  "==",
  "=={.important}",
  "高亮",
);
/** `spoiler` — 剧透隐藏，语法 `!!文本!!` */
export const spoilerCommand = new InlineWrapCommand("!!", "!!", "剧透");
/** `sup` — 上标，语法 `^文本^` */
export const supCommand = new InlineWrapCommand("^", "^", "上标");
/** `sub` — 下标，语法 `~文本~` */
export const subCommand = new InlineWrapCommand("~", "~", "下标");
/** `comment` — 行内注释（多行选区逐行），语法 `%%文本%%` */
export const commentCommand = new InlineWrapCommand("%%", "%%", "注释", true);
/** `math` — 行内公式，语法 `$E=mc^2$` */
export const mathCommand = new InlineWrapCommand("$", "$", "E=mc^2");
