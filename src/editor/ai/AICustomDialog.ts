import { FormDialog } from "@/editor/dialog/FormDialog.js";

/** `aiCustom` 弹窗提交结果。 */
export interface AICustomDialogResult {
  prompts: string;
}

class AICustomFormDialog extends FormDialog<AICustomDialogResult> {
  override get title() {
    return "自定义 AI";
  }

  override get hint() {
    return "描述你希望 AI 如何处理当前选区或全文。";
  }

  override get submitText() {
    return "运行";
  }

  override get className() {
    return "cherry-dialog-form--ai-custom";
  }

  readonly fields = [
    {
      name: "prompts",
      label: "要求",
      type: "textarea" as const,
      required: true,
      placeholder: "例如：把这段话改成更口语化的表达…",
      rows: 5,
    },
  ];

  override validate(raw: Record<string, string | boolean>): string | null {
    if (!String(raw.prompts ?? "").trim()) return "请输入 AI 要求";
    return null;
  }

  toResult(raw: Record<string, string | boolean>): AICustomDialogResult | null {
    const prompts = String(raw.prompts ?? "").trim();
    if (!prompts) return null;
    return { prompts };
  }

  override onMount(form: HTMLFormElement): void {
    form.querySelector("textarea")?.focus();
  }
}

const aiCustomFormDialog = new AICustomFormDialog();

export const renderAICustomDialog =
  aiCustomFormDialog.render.bind(aiCustomFormDialog);
