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

/**
 * 将弹窗数据转为 mermaid 围栏 Markdown。
 * @param data - 已校验的 Mermaid 源码和可选宽度
 * @returns 可插入编辑器的 mermaid 围栏
 */
export function mermaidMarkdown(data: MermaidDialogResult): string {
  const info = data.maxWidth?.trim()
    ? ` max-width=${data.maxWidth.trim()}`
    : "";
  return `\`\`\`mermaid${info}\n${data.source}\n\`\`\`\n`;
}

/**
 * 移除用户粘贴 Mermaid 围栏时附带的包裹标记。
 * @param source - 原始 Mermaid 源码或完整围栏块
 * @returns 去除围栏和首尾空白后的纯源码
 */
function cleanMermaidSource(source: string): string {
  let cleaned = source.trim();
  // 移除开头可能包含的 ```mermaid
  cleaned = cleaned.replace(/^```mermaid[ \t]*\n?/, "");
  // 移除结尾的 ```
  cleaned = cleaned.replace(/\n?```[ \t]*$/, "");
  return cleaned.trim();
}

class MermaidFormDialog extends FormDialog<MermaidDialogResult> {
  /** 返回 Mermaid 弹窗标题。 */
  override get title() {
    return "插入 Mermaid 图表";
  }

  /** 返回 Mermaid 官方编辑器链接。 */
  override get link() {
    return {
      text: "Mermaid 官方实时编辑器",
      href: "https://mermaid.live/",
    };
  }

  /** 返回 max-width 字段的填写说明。 */
  override get hint() {
    return "max-width 写纯数字默认 px，或 640px / 80%";
  }

  readonly fields = [SOURCE_FIELD, MAX_WIDTH_FIELD];

  /**
   * 为首次打开的弹窗补充示例源码。
   * @param props - 调用方传入的预填充属性
   * @returns 保留原属性并补齐默认源码的属性
   */
  override prepareProps(
    props: Record<string, unknown>,
  ): Record<string, unknown> {
    return {
      ...props,
      source: props.source ?? TEMPLATE,
    };
  }

  /**
   * 清理表单源码并转换为 Mermaid 数据。
   * @param raw - 表单提交的字段值
   * @returns 源码为空时返回 null，否则返回图表数据
   */
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

/**
 * 将共享 Mermaid 表单挂载到弹窗宿主。
 * @param host - 弹窗内容挂载元素
 * @param props - 弹窗预填充属性
 * @param callbacks - 提交或取消的回调
 * @returns 关闭弹窗时调用的清理函数
 */
export function renderMermaidDialog(
  host: HTMLElement,
  props: Record<string, unknown>,
  callbacks: DialogCallbacks<MermaidDialogResult>,
): () => void {
  return MERMAID_FORM.render(host, props, callbacks);
}

/**
 * 请求 Mermaid 配置并插入对应围栏代码块。
 * @param view - 要修改的 CodeMirror 编辑器实例
 * @param ctx - 提供事件总线的命令上下文
 * @returns 用户取消或缺少事件总线时返回 false
 */
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

  /**
   * 打开 Mermaid 配置弹窗并插入图表。
   * @param view - 要修改的 CodeMirror 编辑器实例
   * @param _payload - 未使用的命令参数
   * @param ctx - 提供事件总线的命令上下文
   * @returns 图表插入结果
   */
  execute(
    view: EditorView,
    _payload: unknown,
    ctx: CommandContext,
  ): boolean | Promise<boolean> {
    return insertMermaid(view, ctx);
  }
}

export const mermaidCommand = new MermaidCommand();
