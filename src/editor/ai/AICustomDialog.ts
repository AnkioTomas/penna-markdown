import { FormDialog } from "@/editor/dialog/FormDialog.js";

/** `aiCustom` 弹窗提交结果。 */
export interface AICustomDialogResult {
  prompts: string;
}

/** 渲染并校验自定义 AI 提示词输入的表单弹窗。 */
class AICustomFormDialog extends FormDialog<AICustomDialogResult> {
  /** 获取自定义 AI 弹窗标题。 */
  override get title() {
    return "自定义 AI";
  }

  /** 获取提示用户描述处理要求的说明文本。 */
  override get hint() {
    return "描述你希望 AI 如何处理当前选区或全文。";
  }

  /** 获取提交按钮的显示文本。 */
  override get submitText() {
    return "运行";
  }

  /** 获取自定义 AI 表单的样式类名。 */
  override get className() {
    return "penna-dialog-form--ai-custom";
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

  /**
   * 确保用户输入非空的 AI 提示词。
   *
   * @param raw 表单字段原始值。
   * @returns 校验错误文本；有效时为 `null`。
   */
  override validate(raw: Record<string, string | boolean>): string | null {
    if (!String(raw.prompts ?? "").trim()) return "请输入 AI 要求";
    return null;
  }

  /**
   * 将提示词字段转换为 AI 命令结果。
   *
   * @param raw 表单字段原始值。
   * @returns 包含已清理提示词的结果；空提示词时为 `null`。
   */
  toResult(raw: Record<string, string | boolean>): AICustomDialogResult | null {
    const prompts = String(raw.prompts ?? "").trim();
    if (!prompts) return null;
    return { prompts };
  }

  /**
   * 在弹窗打开后聚焦提示词输入框。
   *
   * @param form 已挂载的表单元素。
   */
  override onMount(form: HTMLFormElement): void {
    form.querySelector("textarea")?.focus();
  }
}

const aiCustomFormDialog = new AICustomFormDialog();

export const renderAICustomDialog =
  aiCustomFormDialog.render.bind(aiCustomFormDialog);
