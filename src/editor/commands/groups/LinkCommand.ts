/**
 * 链接与图片命令组。
 * 共用 `link` 弹窗（文本、URL、可选标题），分别生成 Markdown 链接与图片语法。
 */
import type { EditorView } from "@codemirror/view";
import { requestDialog } from "@/editor/dialog/requestDialog.js";
import { FormDialog } from "@/editor/dialog/FormDialog.js";
import {
  Command,
  insertText,
  type CommandContext,
} from "@/editor/commands/Command";
import type { DialogCapableCommand } from "@/editor/commands/DialogCommand";
import type { DialogType } from "@/editor/commands/dialogTypes";

/** `link` / `image` 弹窗提交结果。 */
export interface LinkDialogResult {
  text: string;
  url: string;
  title?: string;
}

class LinkFormDialog extends FormDialog<LinkDialogResult> {
  readonly fields = [
    { name: "text", label: "文本", type: "text" as const },
    { name: "url", label: "链接", type: "url" as const, required: true },
    { name: "title", label: "标题（可选）", type: "text" as const },
  ];

  toResult(raw: Record<string, string | boolean>): LinkDialogResult | null {
    const url = String(raw.url ?? "").trim();
    if (!url) return null;
    const title = String(raw.title ?? "").trim();
    return {
      text: String(raw.text ?? "").trim(),
      url,
      title: title || undefined,
    };
  }
}

const linkFormDialog = new LinkFormDialog();

/**
 * `link` — 插入 Markdown 链接 `[text](url)`。
 * 有选区时预填文本与 URL；无 URL 则取消。
 */
export class LinkCommand implements Command, DialogCapableCommand {
  readonly dialogType: DialogType = "link";

  renderDialog = linkFormDialog.render.bind(linkFormDialog);

  async execute(
    view: EditorView,
    _payload: unknown,
    ctx: CommandContext,
  ): Promise<boolean> {
    if (!ctx?.theme) return false;
    const { from, to, empty } = view.state.selection.main;
    const selected = empty ? "" : view.state.sliceDoc(from, to);
    const data = await requestDialog(ctx.theme, "link", {
      text: selected,
      url: selected,
    });
    if (!data?.url) return false;

    const text = data.text || data.url;
    const titleStr = data.title ? ` "${data.title}"` : "";
    insertText(view, `[${text}](${data.url}${titleStr})`);
    return true;
  }
}

/**
 * `image` — 插入 Markdown 图片 `![alt](url)`。
 * 复用 `link` 弹窗，文本字段作为 alt。
 */
export class ImageCommand implements Command, DialogCapableCommand {
  readonly dialogType: DialogType = "link";

  renderDialog = linkFormDialog.render.bind(linkFormDialog);

  async execute(
    view: EditorView,
    _p: unknown,
    ctx: CommandContext,
  ): Promise<boolean> {
    if (!ctx?.theme) return false;
    const { from, to, empty } = view.state.selection.main;
    const selected = empty ? "" : view.state.sliceDoc(from, to);
    const data = await requestDialog(ctx.theme, "link", {
      text: selected || "",
      url: "",
    });
    if (!data?.url) return false;
    const alt = data.text || "";
    const title = data.title ? ` "${data.title}"` : "";
    insertText(view, `![${alt}](${data.url}${title})`);
    return true;
  }
}

/** `link` 命令实例 */
export const linkCommand = new LinkCommand();
/** `image` 命令实例 */
export const imageCommand = new ImageCommand();
