/**
 * 徽章（Badge）命令组。
 * 有选区时直接包裹 `[text]{.variant}`；无选区时打开表单弹窗。
 */
import type { EditorView } from "@codemirror/view";
import { requestDialog } from "@/editor/dialog/requestDialog.js";
import { FormDialog } from "@/editor/dialog/FormDialog.js";
import {
  Command,
  wrapSelection,
  insertText,
  type CommandContext,
} from "@/editor/commands/Command";
import type { DialogCapableCommand } from "@/editor/commands/DialogCommand";
import type { DialogType } from "@/editor/commands/dialogTypes";

/** 徽章样式变体。 */
export type BadgeVariant =
  "note" | "tip" | "important" | "warning" | "caution" | "danger";

/** 徽章相对行内位置（默认 middle 可省略）。 */
export type BadgePosition = "middle" | "top" | "bottom";

/** `badge` 弹窗提交结果。 */
export interface BadgeDialogResult {
  text: string;
  variant: BadgeVariant;
  position?: BadgePosition;
}

const VARIANT_LABELS: Record<BadgeVariant, string> = {
  note: "说明",
  tip: "提示",
  important: "重要",
  warning: "警告",
  caution: "谨慎",
  danger: "危险",
};

const POSITION_LABELS: Record<BadgePosition, string> = {
  middle: "默认",
  top: "顶部",
  bottom: "底部",
};

function badgeSuffix(result: BadgeDialogResult): string {
  const parts: string[] = [result.variant];
  if (result.position && result.position !== "middle")
    parts.push(result.position);
  return `{.${parts.join(" ")}}`;
}

class BadgeFormDialog extends FormDialog<BadgeDialogResult> {
  override get title() {
    return "插入徽章";
  }

  readonly fields = [
    {
      name: "text",
      label: "文本",
      type: "text" as const,
      required: true,
      placeholder: "徽章文字",
    },
    {
      name: "variant",
      label: "样式",
      type: "select" as const,
      options: (Object.keys(VARIANT_LABELS) as BadgeVariant[]).map((v) => ({
        value: v,
        label: VARIANT_LABELS[v],
      })),
      defaultValue: "note",
    },
    {
      name: "position",
      label: "位置",
      type: "select" as const,
      options: (Object.keys(POSITION_LABELS) as BadgePosition[]).map((p) => ({
        value: p,
        label: POSITION_LABELS[p],
      })),
      defaultValue: "middle",
    },
  ];

  toResult(raw: Record<string, string | boolean>): BadgeDialogResult | null {
    const text = String(raw.text ?? "").trim();
    if (!text) return null;
    const position = String(raw.position ?? "middle") as BadgePosition;
    return {
      text,
      variant: String(raw.variant ?? "note") as BadgeVariant,
      position: position === "middle" ? undefined : position,
    };
  }
}

const badgeFormDialog = new BadgeFormDialog();

/**
 * `badge` — 插入行内徽章 `[文本]{.variant}` 或 `{.variant top}`。
 */
export class BadgeCommand implements Command, DialogCapableCommand {
  readonly dialogType: DialogType = "badge";

  renderDialog = badgeFormDialog.render.bind(badgeFormDialog);

  execute(
    view: EditorView,
    payload: unknown,
    ctx: CommandContext,
  ): boolean | Promise<boolean> {
    return BadgeCommand.applyBadge(view, ctx, payload);
  }

  static async applyBadge(
    view: EditorView,
    ctx?: CommandContext,
    payload?: unknown,
  ): Promise<boolean> {
    const { empty } = view.state.selection.main;
    if (!empty) {
      const variant =
        (payload as { variant?: string } | undefined)?.variant ?? "note";
      wrapSelection(view, "[", `]{.${variant}}`);
      return true;
    }
    if (!ctx?.theme) return false;
    const data = await requestDialog(ctx.theme, "badge");
    if (!data?.text) return false;
    insertText(
      view,
      `[${data.text}]${badgeSuffix(data)}`,
      1,
      1 + data.text.length,
    );
    return true;
  }
}

/** `badge` 命令实例 */
export const badgeCommand = new BadgeCommand();

/** @deprecated 兼容 API，请使用 {@link BadgeCommand.applyBadge} */
export const applyBadge = BadgeCommand.applyBadge.bind(BadgeCommand);
