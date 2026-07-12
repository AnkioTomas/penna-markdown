/**
 * ECharts 图表命令。
 * `echarts` 弹窗，编辑 JSON 与可选 max-width。
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

export interface EchartsDialogResult {
  json: string;
  maxWidth?: string;
}

const TEMPLATE = `{
  "xAxis": { "type": "category", "data": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
  "yAxis": { "type": "value" },
  "series": [{ "data": [150, 230, 224, 218, 135, 147, 260], "type": "line" }]
}`;

const JSON_FIELD: FormFieldDef = {
  name: "json",
  label: "ECharts 数据 (JSON)",
  type: "textarea",
  rows: 12,
  required: true,
};

const MAX_WIDTH_FIELD: FormFieldDef = {
  name: "maxWidth",
  label: "最大宽度（可选）",
  type: "text",
  placeholder: "640 或 80%",
};

/**
 * 将弹窗数据转为 echarts 围栏 Markdown。
 * @param data - 已校验的 ECharts 配置和可选宽度
 * @returns 可插入编辑器的 echarts 围栏
 */
export function echartsMarkdown(data: EchartsDialogResult): string {
  const info = data.maxWidth?.trim()
    ? ` max-width=${data.maxWidth.trim()}`
    : "";
  return `\`\`\`echarts${info}\n${data.json}\n\`\`\`\n`;
}

/**
 * 校验 ECharts 配置是否为有效 JSON。
 * @param json - 待校验的配置文本
 * @returns 有效时返回 null，否则返回面向用户的错误信息
 */
export function validateEchartsJson(json: string): string | null {
  try {
    JSON.parse(json);
    return null;
  } catch {
    return "无效的 JSON 格式";
  }
}

class EchartsFormDialog extends FormDialog<EchartsDialogResult> {
  /** 返回 ECharts 弹窗标题。 */
  override get title() {
    return "插入 ECharts 图表";
  }

  readonly fields = [JSON_FIELD, MAX_WIDTH_FIELD];

  /**
   * 为首次打开的弹窗提供图表配置模板。
   * @param props - 调用方传入的预填充属性
   * @returns 保留原属性并补齐默认 JSON 的属性
   */
  override prepareProps(
    props: Record<string, unknown>,
  ): Record<string, unknown> {
    return {
      ...props,
      json: props.json ?? TEMPLATE,
    };
  }

  /** 返回 ECharts 官方示例链接。 */
  override get link() {
    return {
      text: "ECharts 官方示例",
      href: "https://echarts.apache.org/examples/zh/index.html",
    };
  }

  /**
   * 校验 JSON 字段非空且可解析。
   * @param raw - 表单提交的字段值
   * @returns 校验通过时返回 null，否则返回错误信息
   */
  override validate(raw: Record<string, string | boolean>): string | null {
    const json = String(raw.json ?? "").trim();
    if (!json) return "数据不能为空";
    return validateEchartsJson(json);
  }

  /**
   * 将已验证表单字段转换为 ECharts 数据。
   * @param raw - 表单提交的字段值
   * @returns JSON 无效或为空时返回 null，否则返回图表数据
   */
  toResult(raw: Record<string, string | boolean>): EchartsDialogResult | null {
    const json = String(raw.json ?? "").trim();
    if (!json) return null;

    try {
      JSON.parse(json);
    } catch {
      return null;
    }
    const maxWidth = String(raw.maxWidth ?? "").trim();
    return {
      json,
      maxWidth: maxWidth || undefined,
    };
  }
}

const ECHARTS_FORM = new EchartsFormDialog();

/**
 * 将共享 ECharts 表单挂载到弹窗宿主。
 * @param host - 弹窗内容挂载元素
 * @param props - 弹窗预填充属性
 * @param callbacks - 提交或取消的回调
 * @returns 关闭弹窗时调用的清理函数
 */
export function renderEchartsDialog(
  host: HTMLElement,
  props: Record<string, unknown>,
  callbacks: DialogCallbacks<EchartsDialogResult>,
): () => void {
  return ECHARTS_FORM.render(host, props, callbacks);
}

/**
 * 请求 ECharts 配置并插入对应围栏代码块。
 * @param view - 要修改的 CodeMirror 编辑器实例
 * @param ctx - 提供事件总线的命令上下文
 * @returns 用户取消或缺少事件总线时返回 false
 */
async function insertEcharts(
  view: EditorView,
  ctx: CommandContext | undefined,
): Promise<boolean> {
  if (!ctx?.eventBus) return false;
  const data = await requestDialog(ctx.eventBus, "echarts", {});
  if (!data) return false;
  insertSnippet(view, echartsMarkdown(data));
  return true;
}

export class EchartsCommand implements Command, DialogCapableCommand {
  readonly dialogType: DialogType = "echarts";

  renderDialog = renderEchartsDialog;

  /**
   * 打开 ECharts 配置弹窗并插入图表。
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
    return insertEcharts(view, ctx);
  }
}

export const echartsCommand = new EchartsCommand();
