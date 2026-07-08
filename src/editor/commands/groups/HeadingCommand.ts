import { Command, setLinePrefix } from "@/editor/commands/Command";
import type { EditorView } from "@codemirror/view";

class HeadingCommand implements Command {
  /** @param level - 标题级别，1–6 对应 `#` ~ `######` */
  constructor(private level: number) {}

  execute(view: EditorView): boolean {
    if (this.level < 1 || this.level > 6) return false;
    return setLinePrefix(view, "#".repeat(this.level) + " ");
  }
}

/** `heading1` — 一级标题 `# ` */
export const heading1Command = new HeadingCommand(1);
/** `heading2` — 二级标题 `## ` */
export const heading2Command = new HeadingCommand(2);
/** `heading3` — 三级标题 `### ` */
export const heading3Command = new HeadingCommand(3);
/** `heading4` — 四级标题 `#### ` */
export const heading4Command = new HeadingCommand(4);
/** `heading5` — 五级标题 `##### ` */
export const heading5Command = new HeadingCommand(5);
/** `heading6` — 六级标题 `###### ` */
export const heading6Command = new HeadingCommand(6);
