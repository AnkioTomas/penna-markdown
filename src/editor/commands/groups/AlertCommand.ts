/**
 * GFM 告警块命令组。
 * 五种 preset + custom 共用 `alert` 弹窗。
 */
import type { EditorView } from "@codemirror/view";
import {
  Command,
  insertSnippet,
  type CommandContext,
} from "@/editor/commands/Command";

export type AlertKind = "NOTE" | "TIP" | "IMPORTANT" | "WARNING" | "CAUTION";
export type AlertVariant = Lowercase<AlertKind> | "custom";

const PRESET_KIND: Record<Exclude<AlertVariant, "custom">, AlertKind> = {
  note: "NOTE",
  tip: "TIP",
  important: "IMPORTANT",
  warning: "WARNING",
  caution: "CAUTION",
};

export class AlertCommand implements Command {
  constructor(private readonly variant: AlertVariant) {}

  execute(view: EditorView, _payload: unknown, _ctx: CommandContext): boolean {
    const kind = this.variant === "custom" ? "NOTE" : PRESET_KIND[this.variant];
    const { from, to, empty } = view.state.selection.main;

    if (empty) {
      const text = `> [!${kind}]\n> 提示内容\n`;
      const start = text.indexOf("提示内容");
      insertSnippet(view, text, start, start + 4);
      return true;
    }

    const selected = view.state.sliceDoc(from, to);
    const content = selected
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");
    insertSnippet(view, `> [!${kind}]\n${content}\n`);
    return true;
  }
}

export const alertNoteCommand = new AlertCommand("note");
export const alertTipCommand = new AlertCommand("tip");
export const alertImportantCommand = new AlertCommand("important");
export const alertWarningCommand = new AlertCommand("warning");
export const alertCautionCommand = new AlertCommand("caution");
