/**
 * 链接与图片命令组。
 * 内联链接 / 引用式链接 / 引用定义；引用类命令从 ParserStore 读取已有定义供下拉选择。
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
import type { ParserStore } from "@/transformer/core/ParserStore";

/** `link` / `image` 弹窗提交结果。 */
export interface LinkDialogResult {
  text: string;
  url: string;
  title?: string;
}

/** `linkReference` 弹窗提交结果。 */
export interface LinkReferenceDialogResult {
  text: string;
  refId: string;
}

/** `image` 弹窗提交结果。 */
export interface ImageDialogResult {
  text: string;
  url: string;
  title?: string;
  maxWidth?: string;
}

/** `linkRefDef` 弹窗提交结果。 */
export interface LinkRefDefDialogResult {
  label: string;
  url: string;
  title?: string;
}

interface LinkRefInfo {
  id: string;
  href: string;
  title: string;
}

/** 将引用定义转为 Markdown。 */
export function linkRefDefMarkdown(data: LinkRefDefDialogResult): string {
  const label = data.label.trim();
  const url = data.url.trim();
  const titleStr = data.title?.trim() ? ` "${data.title.trim()}"` : "";
  return `[${label}]: ${url}${titleStr}\n`;
}

function previewUrl(url: string, max = 40): string {
  const trimmed = url.trim();
  if (!trimmed) return "无链接";
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

/** 从 ParserStore 收集已有链接引用定义（键 ref_*）。 */
export function collectLinkRefs(store: ParserStore | undefined): LinkRefInfo[] {
  if (!store) return [];
  const refs: LinkRefInfo[] = [];
  for (const [key, value] of Object.entries(store.getAll())) {
    if (!key.startsWith("ref_")) continue;
    const def = value as { id?: string; href?: string; title?: string };
    if (!def?.href) continue;
    refs.push({
      id: def.id ?? key.slice(4),
      href: def.href,
      title: def.title ?? "",
    });
  }
  return refs.sort((a, b) => a.id.localeCompare(b.id));
}

function applyRefIdDatalist(
  form: HTMLFormElement,
  fieldName: string,
  existingRefs: LinkRefInfo[] | undefined,
) {
  if (!existingRefs?.length) return;
  const datalist = document.createElement("datalist");
  datalist.id = "cherry-link-ref-ids";
  for (const ref of existingRefs) {
    const option = document.createElement("option");
    option.value = ref.id;
    option.textContent = previewUrl(ref.href);
    datalist.append(option);
  }
  form.append(datalist);
  const input = form.elements.namedItem(fieldName);
  if (input instanceof HTMLInputElement) {
    input.setAttribute("list", "cherry-link-ref-ids");
  }
}

function mountRefIdSelectSync(form: HTMLFormElement): (() => void) | void {
  const select = form.elements.namedItem("selectedRefId");
  const customInput = form.elements.namedItem("customRefId");
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

class LinkFormDialog extends FormDialog<LinkDialogResult> {
  readonly fields = [
    { name: "text", label: "文本", type: "text" as const },
    { name: "url", label: "链接", type: "url" as const, required: true },
    { name: "title", label: "标题（可选）", type: "text" as const },
  ];

  toResult(raw: Record<string, string | boolean>): LinkDialogResult | null {
    const url = String(raw.url ?? "").trim();
    if (!url) return null;
    const title = String(raw.title ?? "").trim();
    return {
      text: String(raw.text ?? "").trim(),
      url,
      title: title || undefined,
    };
  }
}

const linkFormDialog = new LinkFormDialog();

class ImageFormDialog extends FormDialog<ImageDialogResult> {
  override get title() {
    return "插入图片";
  }

  readonly fields = [
    { name: "text", label: "图片描述", type: "text" as const },
    { name: "url", label: "图片链接", type: "url" as const, required: true },
    { name: "title", label: "标题（可选）", type: "text" as const },
    {
      name: "maxWidth",
      label: "最大宽度",
      type: "text" as const,
      placeholder: "如 100% 或 500px",
    },
  ];

  toResult(raw: Record<string, string | boolean>): ImageDialogResult | null {
    const url = String(raw.url ?? "").trim();
    if (!url) return null;
    const title = String(raw.title ?? "").trim();
    const maxWidth = String(raw.maxWidth ?? "").trim();
    return {
      text: String(raw.text ?? "").trim(),
      url,
      title: title || undefined,
      maxWidth: maxWidth || undefined,
    };
  }
}

const imageFormDialog = new ImageFormDialog();

class LinkReferenceFormDialog extends FormDialog<LinkReferenceDialogResult> {
  private fieldsForRender: FormFieldDef[] = [];

  override get title() {
    return "插入引用式链接";
  }

  override get hint() {
    return "生成 [文本][标识]；可选取文档中已有的链接引用定义";
  }

  override get className() {
    return "cherry-dialog-form--link-reference";
  }

  override get fields() {
    return this.fieldsForRender;
  }

  override render(
    host: HTMLElement,
    props: Record<string, unknown>,
    callbacks: DialogCallbacks<LinkReferenceDialogResult>,
  ): () => void {
    const existingRefs = (props.linkRefs as LinkRefInfo[] | undefined) ?? [];
    const textField: FormFieldDef = {
      name: "text",
      label: "链接文本",
      type: "text",
      required: true,
      placeholder: "显示文字",
    };

    if (existingRefs.length > 0) {
      this.fieldsForRender = [
        textField,
        {
          name: "selectedRefId",
          label: "选择已有引用",
          type: "select",
          required: true,
          options: [
            ...existingRefs.map((ref) => ({
              value: ref.id,
              label: `${ref.id} — ${previewUrl(ref.href)}`,
            })),
            { value: "__NEW__", label: "新建引用标识…" },
          ],
        },
        {
          name: "customRefId",
          label: "引用标识",
          type: "text",
          hidden: true,
          placeholder: "输入新的引用标识",
        },
      ];
    } else {
      this.fieldsForRender = [
        textField,
        {
          name: "customRefId",
          label: "引用标识",
          type: "text",
          required: true,
          placeholder: "demo-ref",
        },
      ];
    }

    return super.render(host, props, callbacks);
  }

  toResult(
    raw: Record<string, string | boolean>,
  ): LinkReferenceDialogResult | null {
    const text = String(raw.text ?? "").trim();
    if (!text) return null;
    let refId = String(raw.selectedRefId ?? "");
    if (!refId || refId === "__NEW__") {
      refId = String(raw.customRefId ?? "").trim();
    }
    if (!refId) return null;
    return { text, refId };
  }

  override onMount(form: HTMLFormElement) {
    return mountRefIdSelectSync(form);
  }
}

class LinkRefDefFormDialog extends FormDialog<LinkRefDefDialogResult> {
  override get title() {
    return "插入链接引用定义";
  }

  override get hint() {
    return '生成 [标识]: url "标题"，供引用式链接使用';
  }

  readonly fields = [
    {
      name: "label",
      label: "引用标识",
      type: "text" as const,
      required: true,
      placeholder: "demo-ref",
    },
    { name: "url", label: "链接", type: "url" as const, required: true },
    { name: "title", label: "标题（可选）", type: "text" as const },
  ];

  toResult(
    raw: Record<string, string | boolean>,
  ): LinkRefDefDialogResult | null {
    const url = String(raw.url ?? "").trim();
    if (!url) return null;
    const label = String(raw.label ?? "").trim();
    if (!label) return null;
    const title = String(raw.title ?? "").trim();
    return { label, url, title: title || undefined };
  }

  override onMount(form: HTMLFormElement, props: Record<string, unknown>) {
    applyRefIdDatalist(
      form,
      "label",
      props.linkRefs as LinkRefInfo[] | undefined,
    );
  }
}

const linkReferenceFormDialog = new LinkReferenceFormDialog();
const linkRefDefFormDialog = new LinkRefDefFormDialog();

function slugRefId(text: string): string {
  const slug = text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
  return slug || "ref";
}

class LinkRefCommandImpl implements Command, DialogCapableCommand {
  constructor(
    public readonly dialogType: DialogType,
    private readonly dialog: FormDialog<
      LinkReferenceDialogResult | LinkRefDefDialogResult
    >,
    private readonly apply: (
      view: EditorView,
      data: LinkReferenceDialogResult | LinkRefDefDialogResult,
    ) => boolean,
    private readonly buildProps: (
      view: EditorView,
      linkRefs: LinkRefInfo[],
    ) => Record<string, unknown>,
  ) {}

  renderDialog = this.dialog.render.bind(this.dialog);

  async execute(
    view: EditorView,
    _payload: unknown,
    ctx: CommandContext,
  ): Promise<boolean> {
    if (!ctx?.eventBus) return false;
    const linkRefs = collectLinkRefs(ctx.getStore?.());
    const data = (await requestDialog(
      ctx.eventBus,
      this.dialogType,
      this.buildProps(view, linkRefs),
    )) as LinkReferenceDialogResult | LinkRefDefDialogResult | null;
    if (!data) return false;
    return this.apply(view, data);
  }
}

/**
 * `link` — 插入 Markdown 链接 `[text](url)`。
 */
export class LinkCommand implements Command, DialogCapableCommand {
  readonly dialogType: DialogType = "link";

  renderDialog = linkFormDialog.render.bind(linkFormDialog);

  async execute(
    view: EditorView,
    _payload: unknown,
    ctx: CommandContext,
  ): Promise<boolean> {
    if (!ctx?.eventBus) return false;
    const { from, to, empty } = view.state.selection.main;
    const selected = empty ? "" : view.state.sliceDoc(from, to);
    const data = await requestDialog(ctx.eventBus, "link", {
      text: selected,
      url: selected,
    });
    if (!data?.url) return false;

    const text = data.text || data.url;
    const titleStr = data.title ? ` "${data.title}"` : "";
    insertText(view, `[${text}](${data.url}${titleStr})`);
    return true;
  }
}

/**
 * `image` — 插入 Markdown 图片 `![alt](url)`。
 */
export class ImageCommand implements Command, DialogCapableCommand {
  readonly dialogType: DialogType = "image";

  renderDialog = imageFormDialog.render.bind(imageFormDialog);

  async execute(
    view: EditorView,
    _p: unknown,
    ctx: CommandContext,
  ): Promise<boolean> {
    if (!ctx?.eventBus) return false;
    const { from, to, empty } = view.state.selection.main;
    const selected = empty ? "" : view.state.sliceDoc(from, to);
    const data = await requestDialog(ctx.eventBus, "image", {
      text: selected || "",
      url: "",
    });
    if (!data?.url) return false;
    const alt = data.text || "";
    const title = data.title ? ` "${data.title}"` : "";
    let md = `![${alt}](${data.url}${title})`;
    if (data.maxWidth) {
      md += `{max-width=${data.maxWidth}}`;
    }
    insertText(view, md);
    return true;
  }
}

/** `link` 命令实例 */
export const linkCommand = new LinkCommand();
/** `image` 命令实例 */
export const imageCommand = new ImageCommand();

/** `linkReference` — 插入引用式链接 `[text][ref]`，可选取已有引用定义。 */
export const linkReferenceCommand = new LinkRefCommandImpl(
  "linkReference",
  linkReferenceFormDialog,
  (view, data) => {
    const { text, refId } = data as LinkReferenceDialogResult;
    insertText(view, `[${text}][${refId}]`);
    return true;
  },
  (view, linkRefs) => {
    const { from, to, empty } = view.state.selection.main;
    const selected = empty ? "" : view.state.sliceDoc(from, to);
    const props: Record<string, unknown> = {
      linkRefs,
      text: selected || "",
    };
    const match = linkRefs.find((ref) => ref.id === selected);
    if (match) {
      props.selectedRefId = match.id;
    } else if (selected) {
      props.customRefId = slugRefId(selected);
    }
    return props;
  },
);

/** `linkRefDef` — 插入链接引用定义 `[id]: url "title"`。 */
export const linkRefDefCommand = new LinkRefCommandImpl(
  "linkRefDef",
  linkRefDefFormDialog,
  (view, data) => {
    insertText(view, linkRefDefMarkdown(data as LinkRefDefDialogResult));
    return true;
  },
  (_view, linkRefs) => ({ linkRefs }),
);
