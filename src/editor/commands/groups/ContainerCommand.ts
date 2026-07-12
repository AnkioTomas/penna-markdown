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
  | "caution"
  | "danger"
  | "center"
  | "left"
  | "right"
  | "justify"
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
  caution: { type: "caution", title: "谨慎" },
  danger: { type: "danger", title: "危险" },
  center: { type: "center", title: "" },
  left: { type: "left", title: "" },
  right: { type: "right", title: "" },
  justify: { type: "justify", title: "" },
};

export class ContainerCommand implements Command {
  /**
   * 创建固定容器预设的命令。
   * @param variant - 决定容器类型和默认标题的预设标识
   */
  constructor(private readonly variant: ContainerVariant) {}

  /**
   * 用容器语法包裹选区，或插入可编辑的默认容器。
   * @param view - 要修改的 CodeMirror 编辑器实例
   * @param _payload - 未使用的命令参数
   * @param _ctx - 未使用的命令上下文
   * @returns 始终返回 true，表示已插入容器
   */
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
export const containerCautionCommand = new ContainerCommand("caution");
export const containerDangerCommand = new ContainerCommand("danger");
export const containerCenterCommand = new ContainerCommand("center");
export const containerLeftCommand = new ContainerCommand("left");
export const containerRightCommand = new ContainerCommand("right");
export const containerJustifyCommand = new ContainerCommand("justify");
