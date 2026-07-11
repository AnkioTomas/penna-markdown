/**
 * Mermaid 图表命令。
 * `mermaid` 弹窗，编辑源码与可选 max-width。
 */
import type { EditorView } from "@codemirror/view";
import { requestDialog } from "@/editor/dialog/requestDialog.js";
import { FormDialog, type FormFieldDef } from "@/editor/dialog/FormDialog.js";
import {
  Command,
  insertSnippet,
  type CommandContext,
} from "@/editor/commands/Command";
import type {
  DialogCallbacks,
  DialogCapableCommand,
} from "@/editor/commands/DialogCommand";
import type { DialogType } from "@/editor/commands/dialogTypes";

export interface MermaidDialogResult {
  source: string;
  maxWidth?: string;
}

const TEMPLATE = "flowchart TD\n  A[开始] --> B{判断}\n  B -->|是| C[结束]";

const SOURCE_FIELD: FormFieldDef = {
  name: "source",
  label: "Mermaid 源码",
  type: "textarea",
  rows: 10,
  required: true,
};

const MAX_WIDTH_FIELD: FormFieldDef = {
  name: "maxWidth",
  label: "最大宽度（可选）",
  type: "text",
  placeholder: "640 或 80%",
};

/** 将弹窗数据转为 mermaid 围栏 Markdown。 */
export function mermaidMarkdown(data: MermaidDialogResult): string {
  const info = data.maxWidth?.trim()
    ? ` max-width=${data.maxWidth.trim()}`
    : "";
  return `\`\`\`mermaid${info}\n${data.source}\n\`\`\`\n`;
}

function cleanMermaidSource(source: string): string {
  let cleaned = source.trim();
  // 移除开头可能包含的 ```mermaid
  cleaned = cleaned.replace(/^```mermaid[ \t]*\n?/, "");
  // 移除结尾的 ```
  cleaned = cleaned.replace(/\n?```[ \t]*$/, "");
  return cleaned.trim();
}

class MermaidFormDialog extends FormDialog<MermaidDialogResult> {
  override get title() {
    return "插入 Mermaid 图表";
  }

  override get link() {
    return {
      text: "Mermaid 官方实时编辑器",
      href: "https://mermaid.live/",
    };
  }

  override get hint() {
    return "max-width 写纯数字默认 px，或 640px / 80%";
  }

  readonly fields = [SOURCE_FIELD, MAX_WIDTH_FIELD];

  override prepareProps(
    props: Record<string, unknown>,
  ): Record<string, unknown> {
    return {
      ...props,
      source: props.source ?? TEMPLATE,
    };
  }

  toResult(raw: Record<string, string | boolean>): MermaidDialogResult | null {
    let source = String(raw.source ?? "").trim();
    if (!source) return null;

    source = cleanMermaidSource(source);
    if (!source) return null;

    const maxWidth = String(raw.maxWidth ?? "").trim();
    return {
      source,
      maxWidth: maxWidth || undefined,
    };
  }
}

const MERMAID_FORM = new MermaidFormDialog();

export function renderMermaidDialog(
  host: HTMLElement,
  props: Record<string, unknown>,
  callbacks: DialogCallbacks<MermaidDialogResult>,
): () => void {
  return MERMAID_FORM.render(host, props, callbacks);
}

async function insertMermaid(
  view: EditorView,
  ctx: CommandContext | undefined,
): Promise<boolean> {
  if (!ctx?.eventBus) return false;
  const data = await requestDialog(ctx.eventBus, "mermaid", {});
  if (!data) return false;
  insertSnippet(view, mermaidMarkdown(data));
  return true;
}

export class MermaidCommand implements Command, DialogCapableCommand {
  readonly dialogType: DialogType = "mermaid";

  renderDialog = renderMermaidDialog;

  execute(
    view: EditorView,
    _payload: unknown,
    ctx: CommandContext,
  ): boolean | Promise<boolean> {
    return insertMermaid(view, ctx);
  }
}

export const mermaidCommand = new MermaidCommand();
