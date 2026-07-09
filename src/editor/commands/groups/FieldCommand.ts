/**
 * 字段文档命令组。
 * 单个字段使用极简弹窗辅助填写，字段组使用模板直接插入。
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

export type FieldVariant = "basic" | "group";
export type FieldStatus = "required" | "optional" | "deprecated";

export interface FieldDialogResult {
  name: string;
  fieldType: string;
  status: FieldStatus;
  defaultValue?: string;
  description: string;
}

class BasicFieldFormDialog extends FormDialog<FieldDialogResult> {
  override get title() {
    return "插入字段";
  }

  override get hint() {
    return "生成 ::: field name + @type / @required 等指令";
  }

  readonly fields = [
    {
      name: "name",
      label: "字段名称",
      type: "text" as const,
      required: true,
      placeholder: "fieldName",
      defaultValue: "fieldName",
    },
    {
      name: "fieldType",
      label: "字段类型",
      type: "text" as const,
      placeholder: "string",
      defaultValue: "string",
    },
    {
      name: "status",
      label: "字段状态",
      type: "select" as const,
      options: [
        { value: "required", label: "必填 @required" },
        { value: "optional", label: "可选 @optional" },
        { value: "deprecated", label: "弃用 @deprecated" },
      ],
      defaultValue: "required",
    },
    {
      name: "defaultValue",
      label: "默认值（可选）",
      type: "text" as const,
      placeholder: "true",
    },
    {
      name: "description",
      label: "说明",
      type: "textarea" as const,
      rows: 2,
      defaultValue: "字段说明",
    },
  ];

  toResult(raw: Record<string, string | boolean>): FieldDialogResult | null {
    const name = String(raw.name ?? "").trim();
    if (!name) return null;
    return {
      name,
      fieldType: String(raw.fieldType ?? "").trim() || "string",
      status: String(raw.status ?? "required") as FieldStatus,
      defaultValue: String(raw.defaultValue ?? "").trim() || undefined,
      description: String(raw.description ?? "").trim() || "字段说明",
    };
  }
}

export const basicFieldFormDialog = new BasicFieldFormDialog();

export class FieldCommand implements Command, DialogCapableCommand {
  readonly dialogType: DialogType = "field";
  renderDialog = basicFieldFormDialog.render.bind(basicFieldFormDialog);

  constructor(private readonly variant: FieldVariant) {}

  async execute(
    view: EditorView,
    _payload: unknown,
    ctx: CommandContext,
  ): Promise<boolean> {
    const state = view.state;
    const selection = state.selection.main;
    const selectedText = state.sliceDoc(selection.from, selection.to);
    const desc = selectedText ? selectedText : "字段说明";

    if (this.variant === "group") {
      const snippet = `:::: field-group\n\n::: field field1\n@type string\n@required\n${desc}\n:::\n\n::: field field2\n@type string\n@optional\n字段 2 说明\n:::\n\n::::\n`;
      insertSnippet(view, snippet);
      return true;
    }

    if (!ctx?.theme) return false;
    // 如果选中文本，则覆盖弹窗默认的 description 字段
    const data = await requestDialog(ctx.theme, "field", { description: desc });
    if (!data) return false;

    const lines = [`::: field ${data.name}`];
    if (data.fieldType) lines.push(`@type ${data.fieldType}`);
    if (data.status === "required") lines.push("@required");
    else if (data.status === "optional") lines.push("@optional");
    else if (data.status === "deprecated") lines.push("@deprecated");

    if (data.defaultValue) lines.push(`@default ${data.defaultValue}`);
    lines.push(data.description);
    lines.push(":::");

    insertSnippet(view, lines.join("\n") + "\n");
    return true;
  }
}

/** `field` — 单个字段块 */
export const fieldCommand = new FieldCommand("basic");
/** `fieldGroup` — 字段组容器 */
export const fieldGroupCommand = new FieldCommand("group");
