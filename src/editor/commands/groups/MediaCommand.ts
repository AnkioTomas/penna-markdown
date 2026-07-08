/**
 * 媒体嵌入命令组。
 * 插入 Cherry 扩展语法 `!video[label](url)`、`!audio`、`!iframe`。
 */
import type { EditorView } from "@codemirror/view";
import { requestDialog } from "@/editor/dialog/requestDialog.js";
import { FormDialog, type FormFieldDef } from "@/editor/dialog/FormDialog.js";
import {
  Command,
  insertText,
  type CommandContext,
} from "@/editor/commands/Command";
import type { DialogCapableCommand } from "@/editor/commands/DialogCommand";
import type { DialogType } from "@/editor/commands/dialogTypes";

/** `media` 弹窗提交结果。 */
export interface MediaDialogResult {
  kind: "video" | "audio" | "iframe";
  label: string;
  url: string;
  poster?: string;
  maxWidth?: string;
  maxHeight?: string;
}

const KIND_LABELS: Record<MediaDialogResult["kind"], string> = {
  video: "视频",
  audio: "音频",
  iframe: "嵌入页",
};

/** 将媒体数据转为 Cherry 媒体 Markdown。 */
export function mediaMarkdown(data: MediaDialogResult): string {
  const label = data.label;
  let md = `!${data.kind}[${label}](${data.url})`;
  const attrs: string[] = [];
  if (data.poster) attrs.push(`poster=${data.poster}`);
  if (data.maxWidth) attrs.push(`max-width=${data.maxWidth}`);
  if (data.maxHeight) attrs.push(`max-height=${data.maxHeight}`);
  if (attrs.length > 0) {
    md += `{${attrs.join(" ")}}`;
  }
  return `${md}\n`;
}

class MediaFormDialog extends FormDialog<MediaDialogResult> {
  constructor(private readonly kind: MediaDialogResult["kind"]) {
    super();
  }

  override get title() {
    return `插入${KIND_LABELS[this.kind]}`;
  }

  override get fields(): FormFieldDef[] {
    const list: FormFieldDef[] = [
      {
        name: "label",
        label: "标题",
        type: "text",
        placeholder: "显示标题",
      },
      {
        name: "url",
        label: "地址",
        type: "url",
        required: true,
        placeholder: "https://...",
      },
    ];

    if (this.kind === "video") {
      list.push({
        name: "poster",
        label: "封面（可选）",
        type: "url",
        placeholder: "https://...",
      });
    }

    if (this.kind === "video" || this.kind === "iframe") {
      list.push(
        {
          name: "maxWidth",
          label: "最大宽度",
          type: "text",
          placeholder: "如 100% 或 500px",
        },
        {
          name: "maxHeight",
          label: "最大高度",
          type: "text",
          placeholder: "如 100% 或 500px",
        },
      );
    }

    return list;
  }

  toResult(raw: Record<string, string | boolean>): MediaDialogResult | null {
    const url = String(raw.url ?? "").trim();
    if (!url) return null;
    const poster = String(raw.poster ?? "").trim();
    const maxWidth = String(raw.maxWidth ?? "").trim();
    const maxHeight = String(raw.maxHeight ?? "").trim();
    return {
      kind: this.kind,
      label: String(raw.label ?? "").trim() || KIND_LABELS[this.kind],
      url,
      poster: poster || undefined,
      maxWidth: maxWidth || undefined,
      maxHeight: maxHeight || undefined,
    };
  }
}

/** 媒体命令基类，`kind` 在构造时固定（video / audio / iframe）。 */
export class MediaCommand implements Command, DialogCapableCommand {
  readonly dialogType: DialogType = "media";

  constructor(private readonly kind: MediaDialogResult["kind"]) {}

  renderDialog = (
    host: HTMLElement,
    props: Record<string, unknown>,
    callbacks: Parameters<MediaFormDialog["render"]>[2],
  ) => {
    const kind = (props.kind as MediaDialogResult["kind"]) || "video";
    return new MediaFormDialog(kind).render(host, props, callbacks);
  };

  async execute(
    view: EditorView,
    _p: unknown,
    ctx: CommandContext,
  ): Promise<boolean> {
    if (!ctx?.theme) return false;
    const { from, to, empty } = view.state.selection.main;
    const selected = empty ? "" : view.state.sliceDoc(from, to);
    const data = await requestDialog(ctx.theme, "media", {
      kind: this.kind,
      label: selected || undefined,
    });
    if (!data?.url) return false;
    insertText(view, mediaMarkdown(data));
    return true;
  }
}

/** `video` — 插入视频嵌入 */
export const videoCommand = new MediaCommand("video");
/** `audio` — 插入音频嵌入 */
export const audioCommand = new MediaCommand("audio");
/** `iframe` — 插入 iframe 嵌入页 */
export const iframeCommand = new MediaCommand("iframe");
