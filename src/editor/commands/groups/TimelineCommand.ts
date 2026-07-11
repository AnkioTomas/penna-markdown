/**
 * 时间线容器与节点命令。
 * 包含基础的弹窗配置（方便用户查看支持的类型和选项），输出原生的 Markdown 时间线语法。
 */
import type { EditorView } from "@codemirror/view";
import { requestDialog } from "@/editor/dialog/requestDialog.js";
import { FormDialog } from "@/editor/dialog/FormDialog.js";
import {
  Command,
  insertSnippet,
  type CommandContext,
} from "@/editor/commands/Command";
import type { DialogCapableCommand } from "@/editor/commands/DialogCommand";
import type { DialogType } from "@/editor/commands/dialogTypes";

export interface TimelineContainerDialogResult {
  placement: string;
  lineStyle: string;
}

export interface TimelineNodeDialogResult {
  title: string;
  time: string;
  type: string;
  content: string;
}

// 容器配置弹窗
class TimelineContainerDialog extends FormDialog<TimelineContainerDialogResult> {
  override get title() {
    return "插入时间线容器";
  }
  readonly fields = [
    {
      name: "placement",
      label: "布局",
      type: "select" as const,
      options: [
        { value: "", label: "默认 (靠左)" },
        { value: "right", label: "靠右" },
        { value: "between", label: "交错分布" },
      ],
      defaultValue: "",
    },
    {
      name: "lineStyle",
      label: "连线",
      type: "select" as const,
      options: [
        { value: "", label: "默认 (实线)" },
        { value: "dotted", label: "点线" },
        { value: "dashed", label: "虚线" },
      ],
      defaultValue: "",
    },
  ];

  toResult(
    raw: Record<string, string | boolean>,
  ): TimelineContainerDialogResult {
    return {
      placement: String(raw.placement ?? ""),
      lineStyle: String(raw.lineStyle ?? ""),
    };
  }
}

// 节点配置弹窗
class TimelineNodeDialog extends FormDialog<TimelineNodeDialogResult> {
  override get title() {
    return "插入时间线节点";
  }
  readonly fields = [
    {
      name: "title",
      label: "标题",
      type: "text" as const,
      required: true,
      defaultValue: "里程碑节点",
    },
    {
      name: "time",
      label: "时间",
      type: "text" as const,
      required: true,
      defaultValue: new Date().toISOString().split("T")[0],
    },
    {
      name: "type",
      label: "类型",
      type: "select" as const,
      options: [
        { value: "info", label: "信息 (info)" },
        { value: "success", label: "成功 (success)" },
        { value: "warning", label: "警告 (warning)" },
        { value: "danger", label: "危险 (danger)" },
        { value: "tip", label: "提示 (tip)" },
        { value: "caution", label: "注意 (caution)" },
        { value: "important", label: "重要 (important)" },
      ],
      defaultValue: "info",
    },
    {
      name: "content",
      label: "说明",
      type: "textarea" as const,
      rows: 2,
    },
  ];

  toResult(
    raw: Record<string, string | boolean>,
  ): TimelineNodeDialogResult | null {
    const title = String(raw.title ?? "").trim();
    if (!title) return null;
    return {
      title,
      time: String(raw.time ?? "").trim() || "2024-01-01",
      type: String(raw.type ?? "info"),
      content: String(raw.content ?? "").trim(),
    };
  }
}

export const timelineContainerDialog = new TimelineContainerDialog();
export const timelineNodeDialog = new TimelineNodeDialog();

export class TimelineContainerCommand implements Command, DialogCapableCommand {
  readonly dialogType: DialogType = "timelineContainer";
  renderDialog = timelineContainerDialog.render.bind(timelineContainerDialog);

  async execute(
    view: EditorView,
    _payload: unknown,
    ctx: CommandContext,
  ): Promise<boolean> {
    if (!ctx?.eventBus) return false;
    const data = await requestDialog(ctx.eventBus, "timelineContainer");
    if (!data) return false;

    const attrs = [
      data.placement ? `placement="${data.placement}"` : "",
      data.lineStyle ? `line="${data.lineStyle}"` : "",
    ]
      .filter(Boolean)
      .join(" ");

    const suffix = attrs ? ` ${attrs}` : "";
    const defaultTime = new Date().toISOString().split("T")[0];
    const snippet = `::: timeline${suffix}\n\n- [${defaultTime}:info] 里程碑节点\n  在此处撰写说明内容\n\n:::\n`;

    insertSnippet(view, snippet);
    return true;
  }
}

export class TimelineNodeCommand implements Command, DialogCapableCommand {
  readonly dialogType: DialogType = "timelineNode";
  renderDialog = timelineNodeDialog.render.bind(timelineNodeDialog);

  async execute(
    view: EditorView,
    _payload: unknown,
    ctx: CommandContext,
  ): Promise<boolean> {
    if (!ctx?.eventBus) return false;
    const data = await requestDialog(ctx.eventBus, "timelineNode");
    if (!data) return false;

    // 如果是 info 就不需要写后缀，保持极简
    const typeSuffix = data.type && data.type !== "info" ? `:${data.type}` : "";
    const contentText = data.content
      ? `\n  ${data.content.replace(/\n/g, "\n  ")}`
      : "";

    const snippet = `- [${data.time}${typeSuffix}] ${data.title}${contentText}\n`;
    insertSnippet(view, snippet);
    return true;
  }
}

export const timelineContainerCommand = new TimelineContainerCommand();
export const timelineNodeCommand = new TimelineNodeCommand();
