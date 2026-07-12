/**
 * 代码块命令组。
 * 四种 variant 共用 `codeBlock` 弹窗类型，按 `props.variant` 渲染各自独立的表单。
 */
import type { EditorView } from "@codemirror/view";
import { requestDialog } from "@/editor/dialog/requestDialog.js";
import { FormDialog, type FormFieldDef } from "@/editor/dialog/FormDialog.js";
import {
  Command,
  insertText,
  insertSnippet,
  type CommandContext,
} from "@/editor/commands/Command";
import type {
  DialogCallbacks,
  DialogCapableCommand,
} from "@/editor/commands/DialogCommand";
import type { DialogType } from "@/editor/commands/dialogTypes";

/** 代码块围栏变体，固化在命令名中（如 `codeBlockTitle`）。 */
export type CodeBlockVariant = "basic" | "title" | "highlight" | "collapse";

/** `codeBlock` 弹窗提交结果。 */
export interface CodeBlockDialogResult {
  variant: CodeBlockVariant;
  lang: string;
  code: string;
  title?: string;
  highlightLines?: string;
  /** collapse 变体：折叠前最多可见行数，对应围栏 `:collapsed-lines=N` */
  collapsedMaxLines?: number;
}

const VARIANT_LABELS: Record<CodeBlockVariant, string> = {
  basic: "基础围栏",
  title: "带文件名",
  highlight: "行号高亮",
  collapse: "折叠长代码",
};

const LANG_FIELD: FormFieldDef = {
  name: "lang",
  label: "语言（可选）",
  type: "text",
  placeholder: "如 javascript（留空无高亮）",
};

const CODE_FIELD: FormFieldDef = {
  name: "code",
  label: "代码",
  type: "textarea",
  rows: 8,
  required: true,
  placeholder: "在此输入代码...",
};

/**
 * 解析正整数表单字段。
 * @param raw - 待解析的原始文本
 * @returns 有效正整数，或无效输入时的 null
 */
function parsePositiveInt(raw: string): number | null {
  const n = Number.parseInt(raw.trim(), 10);
  if (Number.isNaN(n) || n < 1) return null;
  return n;
}

/**
 * 将通用代码块字段转换为指定变体的数据。
 * @param raw - 表单提交的字段值
 * @param variant - 代码块围栏变体
 * @returns 代码为空时返回 null，否则返回基础代码块数据
 */
function parseCodeBlockRaw(
  raw: Record<string, string | boolean>,
  variant: CodeBlockVariant,
): CodeBlockDialogResult | null {
  const lang = String(raw.lang ?? "").trim();
  const code = String(raw.code ?? "");
  if (!code.trim()) return null;
  const title = String(raw.title ?? "").trim();
  const highlightLines = String(raw.highlightLines ?? "").trim();
  return {
    variant,
    lang,
    code,
    title: title || undefined,
    highlightLines: highlightLines || undefined,
  };
}

/**
 * 根据 variant 生成围栏代码块 Markdown。
 * @param data - 已校验的代码块表单数据
 * @returns 可插入编辑器的围栏 Markdown
 */
export function codeBlockMarkdown(data: CodeBlockDialogResult): string {
  const { lang, code } = data;
  if (data.variant === "title" && data.title) {
    return `\`\`\`${lang} title="${data.title}"\n${code}\n\`\`\`\n`;
  }
  if (data.variant === "highlight" && data.highlightLines) {
    return `\`\`\`${lang}{${data.highlightLines}}\n${code}\n\`\`\`\n`;
  }
  if (data.variant === "collapse") {
    const max = data.collapsedMaxLines ?? 10;
    return `\`\`\`${lang} :collapsed-lines=${max}\n${code}\n\`\`\`\n`;
  }
  return `\`\`\`${lang}\n${code}\n\`\`\`\n`;
}

/** 基础围栏：语言 + 代码。 */
class BasicCodeBlockFormDialog extends FormDialog<CodeBlockDialogResult> {
  /** 返回基础围栏弹窗标题。 */
  override get title() {
    return VARIANT_LABELS.basic;
  }

  readonly fields = [LANG_FIELD, CODE_FIELD];

  /**
   * 将基础围栏表单转换为代码块数据。
   * @param raw - 表单提交的字段值
   * @returns 代码为空时返回 null
   */
  toResult(
    raw: Record<string, string | boolean>,
  ): CodeBlockDialogResult | null {
    return parseCodeBlockRaw(raw, "basic");
  }
}

/** 带文件名：语言 + 文件名 + 代码。 */
class TitleCodeBlockFormDialog extends FormDialog<CodeBlockDialogResult> {
  /** 返回带文件名围栏弹窗标题。 */
  override get title() {
    return VARIANT_LABELS.title;
  }

  /** 返回文件名语法提示。 */
  override get hint() {
    return '文件名写入围栏 info 字符串，如 title="example.js"';
  }

  readonly fields: FormFieldDef[] = [
    LANG_FIELD,
    {
      name: "title",
      label: "文件名",
      type: "text",
      required: true,
      placeholder: "example.js",
    },
    CODE_FIELD,
  ];

  /**
   * 要求用户填写代码块文件名。
   * @param raw - 表单提交的字段值
   * @returns 文件名存在时返回 null，否则返回错误信息
   */
  override validate(raw: Record<string, string | boolean>): string | null {
    if (!String(raw.title ?? "").trim()) return "请填写文件名";
    return null;
  }

  /**
   * 将带文件名围栏表单转换为代码块数据。
   * @param raw - 表单提交的字段值
   * @returns 代码为空时返回 null
   */
  toResult(
    raw: Record<string, string | boolean>,
  ): CodeBlockDialogResult | null {
    return parseCodeBlockRaw(raw, "title");
  }
}

/** 行号高亮：语言 + 高亮行 + 代码。 */
class HighlightCodeBlockFormDialog extends FormDialog<CodeBlockDialogResult> {
  /** 返回高亮围栏弹窗标题。 */
  override get title() {
    return VARIANT_LABELS.highlight;
  }

  /** 返回高亮行号填写提示。 */
  override get hint() {
    return "行号从 1 开始，多个区间用逗号分隔，如 2,4-6";
  }

  readonly fields: FormFieldDef[] = [
    LANG_FIELD,
    {
      name: "highlightLines",
      label: "高亮行",
      type: "text",
      required: true,
      placeholder: "2,4-6",
    },
    CODE_FIELD,
  ];

  /**
   * 要求用户填写高亮行号。
   * @param raw - 表单提交的字段值
   * @returns 行号存在时返回 null，否则返回错误信息
   */
  override validate(raw: Record<string, string | boolean>): string | null {
    if (!String(raw.highlightLines ?? "").trim()) return "请填写高亮行号";
    return null;
  }

  /**
   * 将高亮围栏表单转换为代码块数据。
   * @param raw - 表单提交的字段值
   * @returns 代码为空时返回 null
   */
  toResult(
    raw: Record<string, string | boolean>,
  ): CodeBlockDialogResult | null {
    return parseCodeBlockRaw(raw, "highlight");
  }
}

/** 折叠长代码：语言 + 最多展示行数 + 代码。 */
class CollapseCodeBlockFormDialog extends FormDialog<CodeBlockDialogResult> {
  /** 返回折叠围栏弹窗标题。 */
  override get title() {
    return VARIANT_LABELS.collapse;
  }

  /** 返回折叠行数语法提示。 */
  override get hint() {
    return "超出指定行数后折叠，预览中可点击「展开代码」；语法为围栏 `:collapsed-lines=N`";
  }

  readonly fields: FormFieldDef[] = [
    LANG_FIELD,
    {
      name: "collapsedMaxLines",
      label: "最多展示行数",
      type: "text",
      required: true,
      placeholder: "10",
      defaultValue: "10",
    },
    { ...CODE_FIELD, rows: 12 },
  ];

  /**
   * 校验最大可见行数为正整数。
   * @param raw - 表单提交的字段值
   * @returns 行数有效时返回 null，否则返回错误信息
   */
  override validate(raw: Record<string, string | boolean>): string | null {
    const max = parsePositiveInt(String(raw.collapsedMaxLines ?? ""));
    if (max == null) return "请填写有效的最多展示行数（正整数）";
    return null;
  }

  /**
   * 将折叠围栏表单转换为代码块数据。
   * @param raw - 表单提交的字段值
   * @returns 代码或最大行数无效时返回 null
   */
  toResult(
    raw: Record<string, string | boolean>,
  ): CodeBlockDialogResult | null {
    const base = parseCodeBlockRaw(raw, "collapse");
    if (!base) return null;
    const collapsedMaxLines = parsePositiveInt(
      String(raw.collapsedMaxLines ?? ""),
    );
    if (collapsedMaxLines == null) return null;
    return { ...base, collapsedMaxLines };
  }
}

const CODE_BLOCK_FORMS: Record<
  CodeBlockVariant,
  FormDialog<CodeBlockDialogResult>
> = {
  basic: new BasicCodeBlockFormDialog(),
  title: new TitleCodeBlockFormDialog(),
  highlight: new HighlightCodeBlockFormDialog(),
  collapse: new CollapseCodeBlockFormDialog(),
};

/**
 * 按 `props.variant` 选择对应表单渲染。
 * 四个 command 共用此渲染器，避免 {@link buildDialogRenderers} 互相覆盖。
 * @param host - 弹窗内容挂载元素
 * @param props - 包含代码块变体的弹窗预填充属性
 * @param callbacks - 提交或取消的回调
 * @returns 关闭弹窗时调用的清理函数
 */
export function renderCodeBlockDialog(
  host: HTMLElement,
  props: Record<string, unknown>,
  callbacks: DialogCallbacks<CodeBlockDialogResult>,
): () => void {
  const variant = (props.variant as CodeBlockVariant) ?? "basic";
  const form = CODE_BLOCK_FORMS[variant] ?? CODE_BLOCK_FORMS.basic;
  return form.render(host, props, callbacks);
}

/**
 * 请求代码块表单，并以选区或表单源码插入围栏。
 * @param view - 要修改的 CodeMirror 编辑器实例
 * @param ctx - 提供事件总线的命令上下文
 * @param variant - 要请求的代码块变体
 * @returns 用户取消或缺少事件总线时返回 false
 */
async function insertCodeBlock(
  view: EditorView,
  ctx: CommandContext | undefined,
  variant: CodeBlockVariant,
): Promise<boolean> {
  if (!ctx?.eventBus) return false;
  const { from, to, empty } = view.state.selection.main;
  const selected = empty ? "" : view.state.sliceDoc(from, to);
  const data = await requestDialog(ctx.eventBus, "codeBlock", {
    variant,
    code: selected || undefined,
  });
  if (!data) return false;
  if (selected && !empty) {
    insertText(view, codeBlockMarkdown({ ...data, code: selected }));
    return true;
  }
  insertSnippet(view, codeBlockMarkdown(data));
  return true;
}

/** 代码块命令，variant 在构造时固定并传入弹窗 props。 */
export class CodeBlockCommand implements Command, DialogCapableCommand {
  readonly dialogType: DialogType = "codeBlock";

  renderDialog = renderCodeBlockDialog;

  /**
   * 创建固定围栏变体的命令。
   * @param variant - 传给共享表单的代码块变体
   */
  constructor(private readonly variant: CodeBlockVariant) {}

  /**
   * 打开对应变体的代码块表单并插入围栏。
   * @param view - 要修改的 CodeMirror 编辑器实例
   * @param _payload - 未使用的命令参数
   * @param ctx - 提供事件总线的命令上下文
   * @returns 代码块插入结果
   */
  execute(
    view: EditorView,
    _payload: unknown,
    ctx: CommandContext,
  ): boolean | Promise<boolean> {
    return insertCodeBlock(view, ctx, this.variant);
  }
}

/** `codeBlockBasic` — 基础围栏 ```lang */
export const codeBlockBasicCommand = new CodeBlockCommand("basic");
/** `codeBlockTitle` — 带文件名 ```lang title="..." */
export const codeBlockTitleCommand = new CodeBlockCommand("title");
/** `codeBlockHighlight` — 行号高亮 ```lang{2,4-6} */
export const codeBlockHighlightCommand = new CodeBlockCommand("highlight");
/** `codeBlockCollapse` — 折叠长代码 ```lang :collapsed-lines=N` */
export const codeBlockCollapseCommand = new CodeBlockCommand("collapse");
