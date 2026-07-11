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

function extractText(nodes: any[] | undefined): string {
  if (!nodes) return "";
  let text = "";
  for (const node of nodes) {
    if (node.value) text += node.value;
    if (node.children) text += extractText(node.children);
  }
  return text;
}

function previewText(text: string, max = 30): string {
  const trimmed = text.trim();
  if (!trimmed) return "无内容";
  return trimmed.length > max ? `${trimmed.slice(0, max)}...` : trimmed;
}

function applyDatalist(
  form: HTMLFormElement,
  existingDefs: FootnoteDefInfo[] | undefined,
) {
  if (!existingDefs?.length) return;
  const datalist = document.createElement("datalist");
  datalist.id = "cherry-footnote-ids";
  for (const def of existingDefs) {
    const option = document.createElement("option");
    option.value = def.id;
    option.textContent = previewText(def.text);
    datalist.append(option);
  }
  form.append(datalist);
  const idInput = form.elements.namedItem("id");
  if (idInput instanceof HTMLInputElement) {
    idInput.setAttribute("list", "cherry-footnote-ids");
  }
}

class FootnoteRefDialog extends FormDialog<FootnoteDialogResult> {
  private fieldsForRender: FormFieldDef[] = [];

  override get title() {
    return "插入脚注引用";
  }

  override get className() {
    return "cherry-dialog-form--footnote-ref";
  }

  override get fields() {
    return this.fieldsForRender;
  }

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

  toResult(raw: Record<string, string | boolean>) {
    let id = String(raw.selectedId ?? "");
    if (!id || id === "__NEW__") {
      id = String(raw.customId ?? "").trim();
    }
    if (!id) return null;
    return { id, mode: "ref" as const };
  }

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
  constructor(
    private readonly _title: string,
    private readonly _mode: "def" | "both",
  ) {
    super();
  }
  override get title() {
    return this._title;
  }
  toResult(raw: Record<string, string | boolean>) {
    const id = String(raw.id ?? "").trim();
    const content = String(raw.content ?? "").trim();
    if (!id || !content) return null;
    return { id, content, mode: this._mode };
  }
  override onMount(form: HTMLFormElement, props: Record<string, unknown>) {
    applyDatalist(form, props.footnotes as FootnoteDefInfo[] | undefined);
  }
}

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
  constructor(
    public readonly dialogType: DialogType,
    private readonly dialog: FormDialog<FootnoteDialogResult>,
  ) {}

  renderDialog = this.dialog.render.bind(this.dialog);

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
