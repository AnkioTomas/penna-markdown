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

// 黑洞代理：拦截一切属性访问、方法调用和实例化，最终返回自身
// 用于在解析 JS 对象时提供虚假的全局变量（如 echarts），从而将其引用转化为函数并在 JSON.stringify 时直接丢弃
const ECHARTS_BLACK_HOLE: any = new Proxy(function () {}, {
  get: () => ECHARTS_BLACK_HOLE,
  apply: () => ECHARTS_BLACK_HOLE,
  construct: () => ECHARTS_BLACK_HOLE,
});

const TEMPLATE = `{
  "xAxis": { "type": "category", "data": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
  "yAxis": { "type": "value" },
  "series": [{ "data": [150, 230, 224, 218, 135, 147, 260], "type": "line" }]
}`;

const JSON_FIELD: FormFieldDef = {
  name: "json",
  label: "ECharts 数据 (JSON 或 JS 对象)",
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

/** 将弹窗数据转为 echarts 围栏 Markdown。 */
export function echartsMarkdown(data: EchartsDialogResult): string {
  const info = data.maxWidth?.trim()
    ? ` max-width=${data.maxWidth.trim()}`
    : "";
  return `\`\`\`echarts${info}\n${data.json}\n\`\`\`\n`;
}

function parseEchartsInput(str: string): any {
  str = str.trim();
  // 1. 尝试作为单纯的对象字面量解析
  try {
    const obj = new Function("echarts", `return (${str})`)(ECHARTS_BLACK_HOLE);
    if (obj && typeof obj === "object") return obj;
  } catch {
    // ignore
  }
  // 2. 尝试作为包含 option = { ... } 的赋值语句解析
  try {
    const obj = new Function("echarts", `let option;\n${str}\nreturn option;`)(
      ECHARTS_BLACK_HOLE,
    );
    if (obj && typeof obj === "object") return obj;
  } catch {
    // ignore
  }
  return null;
}

class EchartsFormDialog extends FormDialog<EchartsDialogResult> {
  override get title() {
    return "插入 ECharts 图表";
  }

  readonly fields = [JSON_FIELD, MAX_WIDTH_FIELD];

  override prepareProps(
    props: Record<string, unknown>,
  ): Record<string, unknown> {
    return {
      ...props,
      json: props.json ?? TEMPLATE,
    };
  }

  override get link() {
    return {
      text: "ECharts 官方示例",
      href: "https://echarts.apache.org/examples/zh/index.html",
    };
  }

  override validate(raw: Record<string, string | boolean>): string | null {
    const json = String(raw.json ?? "").trim();
    if (!json) return "数据不能为空";
    try {
      JSON.parse(json);
      return null;
    } catch {
      if (parseEchartsInput(json)) return null;
      return "无效的 JSON 或 JS 对象格式";
    }
  }

  toResult(raw: Record<string, string | boolean>): EchartsDialogResult | null {
    const json = String(raw.json ?? "").trim();
    if (!json) return null;

    let finalJson = "";
    try {
      JSON.parse(json);
      finalJson = json;
    } catch {
      const obj = parseEchartsInput(json);
      if (obj) {
        finalJson = JSON.stringify(obj, null, 2);
      } else {
        return null;
      }
    }
    const maxWidth = String(raw.maxWidth ?? "").trim();
    return {
      json: finalJson,
      maxWidth: maxWidth || undefined,
    };
  }
}

const ECHARTS_FORM = new EchartsFormDialog();

export function renderEchartsDialog(
  host: HTMLElement,
  props: Record<string, unknown>,
  callbacks: DialogCallbacks<EchartsDialogResult>,
): () => void {
  return ECHARTS_FORM.render(host, props, callbacks);
}

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

  execute(
    view: EditorView,
    _payload: unknown,
    ctx: CommandContext,
  ): boolean | Promise<boolean> {
    return insertEcharts(view, ctx);
  }
}

export const echartsCommand = new EchartsCommand();
