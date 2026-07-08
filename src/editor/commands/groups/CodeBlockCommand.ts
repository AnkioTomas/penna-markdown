/**
 * 代码块命令组。
 * 四种 variant 共用 `codeBlock` 弹窗类型，按 `props.variant` 渲染各自独立的表单。
 */
import type { EditorView } from "@codemirror/view";
import { requestDialog } from "@/editor/dialog/requestDialog.js";
import { FormDialog, type FormFieldDef } from "@/editor/dialog/FormDialog.js";
import { Command, insertText, insertSnippet, type CommandContext } from "../Command.js";
import type { DialogCallbacks, DialogCapableCommand } from "../DialogCommand.js";
import type { DialogType } from "../dialogTypes.js";

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
  label: "语言",
  type: "text",
  required: true,
  placeholder: "javascript",
  defaultValue: "javascript",
};

const CODE_FIELD: FormFieldDef = {
  name: "code",
  label: "代码",
  type: "textarea",
  rows: 8,
  required: true,
  placeholder: "console.log('hello');",
  defaultValue: 'console.log("hello");',
};

function parsePositiveInt(raw: string): number | null {
  const n = Number.parseInt(raw.trim(), 10);
  if (Number.isNaN(n) || n < 1) return null;
  return n;
}

function parseCodeBlockRaw(
  raw: Record<string, string | boolean>,
  variant: CodeBlockVariant,
): CodeBlockDialogResult | null {
  const lang = String(raw.lang ?? "").trim() || "text";
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

/** 根据 variant 生成围栏代码块 Markdown。 */
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
  override get title() {
    return VARIANT_LABELS.basic;
  }

  readonly fields = [LANG_FIELD, CODE_FIELD];

  toResult(raw: Record<string, string | boolean>): CodeBlockDialogResult | null {
    return parseCodeBlockRaw(raw, "basic");
  }
}

/** 带文件名：语言 + 文件名 + 代码。 */
class TitleCodeBlockFormDialog extends FormDialog<CodeBlockDialogResult> {
  override get title() {
    return VARIANT_LABELS.title;
  }

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

  override validate(raw: Record<string, string | boolean>): string | null {
    if (!String(raw.title ?? "").trim()) return "请填写文件名";
    return null;
  }

  toResult(raw: Record<string, string | boolean>): CodeBlockDialogResult | null {
    return parseCodeBlockRaw(raw, "title");
  }
}

/** 行号高亮：语言 + 高亮行 + 代码。 */
class HighlightCodeBlockFormDialog extends FormDialog<CodeBlockDialogResult> {
  override get title() {
    return VARIANT_LABELS.highlight;
  }

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

  override validate(raw: Record<string, string | boolean>): string | null {
    if (!String(raw.highlightLines ?? "").trim()) return "请填写高亮行号";
    return null;
  }

  toResult(raw: Record<string, string | boolean>): CodeBlockDialogResult | null {
    return parseCodeBlockRaw(raw, "highlight");
  }
}

/** 折叠长代码：语言 + 最多展示行数 + 代码。 */
class CollapseCodeBlockFormDialog extends FormDialog<CodeBlockDialogResult> {
  override get title() {
    return VARIANT_LABELS.collapse;
  }

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

  override validate(raw: Record<string, string | boolean>): string | null {
    const max = parsePositiveInt(String(raw.collapsedMaxLines ?? ""));
    if (max == null) return "请填写有效的最多展示行数（正整数）";
    return null;
  }

  toResult(raw: Record<string, string | boolean>): CodeBlockDialogResult | null {
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

async function insertCodeBlock(
  view: EditorView,
  ctx: CommandContext | undefined,
  variant: CodeBlockVariant,
): Promise<boolean> {
  if (!ctx?.theme) return false;
  const { from, to, empty } = view.state.selection.main;
  const selected = empty ? "" : view.state.sliceDoc(from, to);
  const data = await requestDialog(ctx.theme, "codeBlock", {
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

  constructor(private readonly variant: CodeBlockVariant) {}

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
