/**
 * HTML 属性追加命令。
 * 在选区后插入 Cherry 扩展属性块，如 `{.highlight}`、`{#id}`。
 */
import type { EditorView } from "@codemirror/view";
import { requestDialog } from "@/editor/dialog/requestDialog.js";
import { FormDialog } from "@/editor/dialog/FormDialog.js";
import {
  Command,
  appendHtmlAttr,
  type CommandContext,
} from "@/editor/commands/Command";
import type { DialogCapableCommand } from "@/editor/commands/DialogCommand";
import type { DialogType } from "@/editor/commands/dialogTypes";

/** `attr` 弹窗提交结果。 */
export interface AttrDialogResult {
  attr: string;
}

class AttrFormDialog extends FormDialog<AttrDialogResult> {
  override get title() {
    return "HTML 属性";
  }

  override get hint() {
    return '追加在选中文本之后，如 .highlight、#id、class="x"';
  }

  override get submitText() {
    return "追加";
  }

  readonly fields = [
    {
      name: "attr",
      label: "属性",
      type: "text" as const,
      required: true,
      placeholder: ".highlight 或 #special",
      defaultValue: ".highlight",
    },
  ];

  toResult(raw: Record<string, string | boolean>): AttrDialogResult | null {
    const attr = String(raw.attr ?? "").trim();
    if (!attr) return null;
    return { attr };
  }
}

const attrFormDialog = new AttrFormDialog();

/** `htmlAttr` — 打开表单追加 HTML 属性到选区后。 */
export class HtmlAttrCommand implements Command, DialogCapableCommand {
  readonly dialogType: DialogType = "attr";

  renderDialog = attrFormDialog.render.bind(attrFormDialog);

  async execute(
    view: EditorView,
    _payload: unknown,
    ctx: CommandContext,
  ): Promise<boolean> {
    if (!ctx?.theme) return false;
    const data = await requestDialog(ctx.theme, "attr", {
      attr: "",
    });
    if (!data) return false;
    appendHtmlAttr(view, data.attr);
    return true;
  }
}

/** `htmlAttr` 命令实例 */
export const htmlAttrCommand = new HtmlAttrCommand();
