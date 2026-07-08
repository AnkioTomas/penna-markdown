/**
 * 自定义容器命令组。
 * 四种 preset 共用 `container` 弹窗。
 */
import type { EditorView } from "@codemirror/view";
import {
  Command,
  insertSnippet,
  type CommandContext,
} from "@/editor/commands/Command";

export type ContainerVariant =
  | "tip"
  | "warning"
  | "note"
  | "info"
  | "important"
  | "danger"
  | "center"
  | "left"
  | "right"
  | "custom";

const PRESET_DEFAULTS: Record<
  Exclude<ContainerVariant, "custom">,
  { type: string; title: string }
> = {
  tip: { type: "tip", title: "提示" },
  warning: { type: "warning", title: "警告" },
  note: { type: "note", title: "说明" },
  info: { type: "info", title: "信息" },
  important: { type: "important", title: "重要" },
  danger: { type: "danger", title: "危险" },
  center: { type: "center", title: "" },
  left: { type: "left", title: "" },
  right: { type: "right", title: "" },
};

export class ContainerCommand implements Command {
  constructor(private readonly variant: ContainerVariant) {}

  execute(view: EditorView, _payload: unknown, _ctx: CommandContext): boolean {
    const preset =
      this.variant === "custom"
        ? PRESET_DEFAULTS.tip
        : PRESET_DEFAULTS[this.variant];
    const head = preset.title
      ? `::: ${preset.type} ${preset.title}`
      : `::: ${preset.type}`;

    const { from, to, empty } = view.state.selection.main;

    if (empty) {
      const text = `${head}\n容器内容\n:::\n`;
      const start = text.indexOf("容器内容");
      insertSnippet(view, text, start, start + 4);
      return true;
    }

    const selected = view.state.sliceDoc(from, to);
    insertSnippet(view, `${head}\n${selected}\n:::\n`);
    return true;
  }
}

export const containerTipCommand = new ContainerCommand("tip");
export const containerWarningCommand = new ContainerCommand("warning");
export const containerNoteCommand = new ContainerCommand("note");
export const containerInfoCommand = new ContainerCommand("info");
export const containerImportantCommand = new ContainerCommand("important");
export const containerDangerCommand = new ContainerCommand("danger");
export const containerCenterCommand = new ContainerCommand("center");
export const containerLeftCommand = new ContainerCommand("left");
export const containerRightCommand = new ContainerCommand("right");
