/**
 * 脚注命令组。
 * 支持仅引用、仅定义、引用+定义三种模式；定义内容追加到文档末尾。
 */
import type { EditorView } from "@codemirror/view";
import { requestDialog } from "@/editor/dialog/requestDialog.js";
import { FormDialog, type FormFieldDef } from "@/editor/dialog/FormDialog.js";
import {
  Command,
  insertText,
  type CommandContext,
} from "@/editor/commands/Command";
import type {
  DialogCallbacks,
  DialogCapableCommand,
} from "@/editor/commands/DialogCommand";
import type { DialogType } from "@/editor/commands/dialogTypes";

/** `footnote` 弹窗提交结果。 */
export interface FootnoteDialogResult {
  id: string;
  content?: string;
  mode: "ref" | "def" | "both";
}

interface FootnoteDefInfo {
  id: string;
  text: string;
}

const FOOTNOTE_DEF_FIELDS: FormFieldDef[] = [
  {
    name: "id",
    label: "标识",
    type: "text",
    required: true,
    placeholder: "1 或 note",
    defaultValue: "1",
  },
  {
    name: "content",
    label: "定义内容",
    type: "textarea",
    rows: 3,
    required: true,
    placeholder: "脚注正文",
  },
];

/**
 * 递归提取脚注 AST 节点中的纯文本。
 * @param nodes - 可选的 AST 节点列表
 * @returns 所有节点 value 的递归拼接文本
 */
function extractText(nodes: any[] | undefined): string {
  if (!nodes) return "";
  let text = "";
  for (const node of nodes) {
    if (node.value) text += node.value;
    if (node.children) text += extractText(node.children);
  }
  return text;
}

/**
 * 截断脚注文本以供下拉选项展示。
 * @param text - 待展示的脚注正文
 * @param max - 截断前允许的最大字符数
 * @returns 非空的完整或截断预览文本
 */
function previewText(text: string, max = 30): string {
  const trimmed = text.trim();
  if (!trimmed) return "无内容";
  return trimmed.length > max ? `${trimmed.slice(0, max)}...` : trimmed;
}

/**
 * 为脚注标识输入框添加已有定义的数据列表。
 * @param form - 已挂载的表单元素
 * @param existingDefs - 可供选择的已有脚注定义
 */
function applyDatalist(
  form: HTMLFormElement,
  existingDefs: FootnoteDefInfo[] | undefined,
) {
  if (!existingDefs?.length) return;
  const datalist = document.createElement("datalist");
  datalist.id = "penna-footnote-ids";
  for (const def of existingDefs) {
    const option = document.createElement("option");
    option.value = def.id;
    option.textContent = previewText(def.text);
    datalist.append(option);
  }
  form.append(datalist);
  const idInput = form.elements.namedItem("id");
  if (idInput instanceof HTMLInputElement) {
    idInput.setAttribute("list", "penna-footnote-ids");
  }
}

class FootnoteRefDialog extends FormDialog<FootnoteDialogResult> {
  private fieldsForRender: FormFieldDef[] = [];

  /** 返回脚注引用弹窗标题。 */
  override get title() {
    return "插入脚注引用";
  }

  /** 返回脚注引用表单的样式类名。 */
  override get className() {
    return "penna-dialog-form--footnote-ref";
  }

  /** 返回本次渲染动态构建的字段列表。 */
  override get fields() {
    return this.fieldsForRender;
  }

  /**
   * 根据已有脚注定义构造引用选择字段后渲染表单。
   * @param host - 弹窗内容挂载元素
   * @param props - 包含已有脚注定义的预填充属性
   * @param callbacks - 提交或取消的回调
   * @returns 父表单提供的清理函数
   */
  override render(
    host: HTMLElement,
    props: Record<string, unknown>,
    callbacks: DialogCallbacks<FootnoteDialogResult>,
  ): () => void {
    const existingDefs =
      (props.footnotes as FootnoteDefInfo[] | undefined) ?? [];
    if (existingDefs.length > 0) {
      this.fieldsForRender = [
        {
          name: "selectedId",
          label: "选择已有脚注",
          type: "select",
          required: true,
          options: [
            ...existingDefs.map((def) => ({
              value: def.id,
              label: `${def.id} — ${previewText(def.text)}`,
            })),
            { value: "__NEW__", label: "新建自定义标识…" },
          ],
        },
        {
          name: "customId",
          label: "引用标识",
          type: "text",
          hidden: true,
          placeholder: "输入新的引用标识",
        },
      ];
    } else {
      this.fieldsForRender = [
        {
          name: "customId",
          label: "引用标识",
          type: "text",
          required: true,
          placeholder: "请输入引用标识",
          defaultValue: "1",
        },
      ];
    }
    return super.render(host, props, callbacks);
  }

  /**
   * 从已有选择或自定义输入中解析脚注标识。
   * @param raw - 表单提交的字段值
   * @returns 标识为空时返回 null
   */
  toResult(raw: Record<string, string | boolean>) {
    let id = String(raw.selectedId ?? "");
    if (!id || id === "__NEW__") {
      id = String(raw.customId ?? "").trim();
    }
    if (!id) return null;
    return { id, mode: "ref" as const };
  }

  /**
   * 同步“新建标识”输入框的显隐和必填状态。
   * @param form - 已挂载的表单元素
   * @returns 可选的事件监听清理函数
   */
  override onMount(form: HTMLFormElement) {
    const select = form.elements.namedItem("selectedId");
    const customInput = form.elements.namedItem("customId");
    if (
      !(select instanceof HTMLSelectElement) ||
      !(customInput instanceof HTMLInputElement)
    ) {
      return;
    }

    const customField = customInput.closest("label");
    const sync = () => {
      const isNew = select.value === "__NEW__";
      if (customField) customField.hidden = !isNew;
      customInput.required = isNew;
      if (isNew) customInput.focus();
    };

    select.addEventListener("change", sync);
    sync();

    return () => select.removeEventListener("change", sync);
  }
}

class FootnoteContentDialog extends FormDialog<FootnoteDialogResult> {
  readonly fields = FOOTNOTE_DEF_FIELDS;
  /**
   * 创建脚注定义或引用加定义的表单。
   * @param _title - 弹窗显示标题
   * @param _mode - 提交结果对应的脚注插入模式
   */
  constructor(
    private readonly _title: string,
    private readonly _mode: "def" | "both",
  ) {
    super();
  }
  /** 返回构造时指定的弹窗标题。 */
  override get title() {
    return this._title;
  }
  /**
   * 将定义表单转换为脚注数据。
   * @param raw - 表单提交的字段值
   * @returns 标识或内容为空时返回 null
   */
  toResult(raw: Record<string, string | boolean>) {
    const id = String(raw.id ?? "").trim();
    const content = String(raw.content ?? "").trim();
    if (!id || !content) return null;
    return { id, content, mode: this._mode };
  }
  /**
   * 挂载已有脚注标识的数据列表。
   * @param form - 已挂载的表单元素
   * @param props - 包含已有脚注定义的预填充属性
   */
  override onMount(form: HTMLFormElement, props: Record<string, unknown>) {
    applyDatalist(form, props.footnotes as FootnoteDefInfo[] | undefined);
  }
}

/**
 * 按模式在光标处插入引用，并可在文末追加定义。
 * @param view - 要修改的 CodeMirror 编辑器实例
 * @param id - 脚注标识
 * @param content - 可选的脚注定义内容
 * @param mode - 插入引用、定义或两者的模式
 * @returns 始终返回 true，表示已派发编辑事务
 */
function applyFootnote(
  view: EditorView,
  id: string,
  content: string | undefined,
  mode: "ref" | "def" | "both",
): boolean {
  if (mode === "ref" || mode === "both") {
    insertText(view, `[^${id}]`);
  }
  if (mode === "def" || mode === "both") {
    const doc = view.state.doc.toString();
    const prefix =
      doc.length === 0
        ? ""
        : doc.endsWith("\n\n")
          ? ""
          : doc.endsWith("\n")
            ? "\n"
            : "\n\n";
    const end = view.state.doc.length;
    view.dispatch({
      changes: {
        from: end,
        to: end,
        insert: `${prefix}[^${id}]: ${content ?? "脚注内容"}\n`,
      },
      scrollIntoView: mode === "def",
    });
  }
  return true;
}

class FootnoteCommandImpl implements Command, DialogCapableCommand {
  /**
   * 创建绑定表单的脚注命令。
   * @param dialogType - 要打开的弹窗类型
   * @param dialog - 负责收集脚注数据的表单
   */
  constructor(
    public readonly dialogType: DialogType,
    private readonly dialog: FormDialog<FootnoteDialogResult>,
  ) {}

  renderDialog = this.dialog.render.bind(this.dialog);

  /**
   * 从最近渲染的 AST 收集定义，打开表单并应用脚注。
   * @param view - 要修改的 CodeMirror 编辑器实例
   * @param _p - 未使用的命令参数
   * @param ctx - 提供事件总线和可选 ParserStore 的命令上下文
   * @returns 用户取消或缺少事件总线时返回 false
   */
  async execute(
    view: EditorView,
    _p: unknown,
    ctx: CommandContext,
  ): Promise<boolean> {
    if (!ctx?.eventBus) return false;

    let footnotes: FootnoteDefInfo[] = [];
    if (ctx.getStore) {
      const store = ctx.getStore();
      if (store?.has("footnoteItems")) {
        const items = store.get("footnoteItems");
        if (Array.isArray(items)) {
          footnotes = items.map((i) => ({
            id: i.id,
            text: extractText(i.children),
          }));
        }
      }
    }

    const data = (await requestDialog(ctx.eventBus, this.dialogType, {
      footnotes,
    })) as FootnoteDialogResult | null;
    if (!data) return false;
    return applyFootnote(view, data.id, data.content, data.mode);
  }
}

/** `footnoteRef` — 仅插入引用 `[^id]` */
export const footnoteRefCommand = new FootnoteCommandImpl(
  "footnoteRef",
  new FootnoteRefDialog(),
);
/** `footnoteDef` — 仅在文末插入定义 `[^id]: content` */
export const footnoteDefCommand = new FootnoteCommandImpl(
  "footnoteDef",
  new FootnoteContentDialog("插入脚注定义", "def"),
);
/** `footnoteBoth` — 同时插入引用与定义 */
export const footnoteBothCommand = new FootnoteCommandImpl(
  "footnoteBoth",
  new FootnoteContentDialog("插入脚注 (引用+定义)", "both"),
);
