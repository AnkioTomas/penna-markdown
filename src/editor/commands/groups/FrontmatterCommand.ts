/**
 * Frontmatter（文档头 YAML）命令。
 * 在文档顶部插入或替换 `---\n...\n---` 块；变量引用可从已有 frontmatter 键下拉选取。
 */
import type { EditorView } from "@codemirror/view";
import YAML from "yaml";
import { requestDialog } from "@/editor/dialog/requestDialog.js";
import { FormDialog, type FormFieldDef } from "@/editor/dialog/FormDialog.js";
import {
  Command,
  insertAtDocumentTop,
  insertText,
  type CommandContext,
} from "@/editor/commands/Command";
import type {
  DialogCallbacks,
  DialogCapableCommand,
} from "@/editor/commands/DialogCommand";
import type { DialogType } from "@/editor/commands/dialogTypes";
import type { ParserStore } from "@/transformer/core/ParserStore";

/** `frontmatter` 弹窗提交结果。 */
export interface FrontmatterDialogResult {
  yaml: string;
}

/** `frontmatterVar` 弹窗提交结果。 */
export interface FrontmatterVarDialogResult {
  path: string;
}

const DEFAULT_YAML = `title: 标题
description: 描述
author:
  name: 作者
tags: [demo]`;

/** 校验 YAML 字符串，无效时返回错误文案。 */
export function validateFrontmatterYaml(yaml: string): string | null {
  const body = yaml.trim();
  if (!body) return "YAML 不能为空";
  try {
    const parsed = YAML.parse(body);
    if (
      parsed === null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return "无效的 YAML 格式：根节点必须是键值对对象";
    }
    return null;
  } catch (err: any) {
    return `无效的 YAML 格式：${err?.message || "语法错误"}`;
  }
}

/** 包装为 frontmatter 围栏 Markdown。 */
export function frontmatterMarkdown(yaml: string): string {
  return `---\n${yaml.trim()}\n---\n\n`;
}

/** 将 frontmatter 对象展平为点分路径列表（供 [[path]] 引用）。 */
export function flattenFrontmatterKeys(
  obj: Record<string, unknown>,
  prefix = "",
): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      keys.push(
        ...flattenFrontmatterKeys(value as Record<string, unknown>, path),
      );
    } else {
      keys.push(path);
    }
  }
  return keys.sort((a, b) => a.localeCompare(b));
}

/** 从 ParserStore 读取 frontmatter 变量路径。 */
export function collectFrontmatterVars(
  store: ParserStore | undefined,
): string[] {
  if (!store?.has("frontMatter")) return [];
  const data = store.get<Record<string, unknown>>("frontMatter");
  if (!data || typeof data !== "object") return [];
  return flattenFrontmatterKeys(data);
}

class FrontmatterFormDialog extends FormDialog<FrontmatterDialogResult> {
  override get title() {
    return "文档头（YAML）";
  }

  override get hint() {
    return "插入到文档顶部，替换已有 frontmatter";
  }

  override get submitText() {
    return "插入到顶部";
  }

  readonly fields = [
    {
      name: "yaml",
      label: "YAML",
      type: "textarea" as const,
      rows: 10,
      required: true,
      defaultValue: DEFAULT_YAML,
    },
  ];

  override prepareProps(
    props: Record<string, unknown>,
  ): Record<string, unknown> {
    return {
      ...props,
      yaml: props.yaml ?? `title: 标题\ndescription: 描述\n`,
    };
  }

  override validate(raw: Record<string, string | boolean>): string | null {
    return validateFrontmatterYaml(String(raw.yaml ?? ""));
  }

  toResult(
    raw: Record<string, string | boolean>,
  ): FrontmatterDialogResult | null {
    const yaml = String(raw.yaml ?? "").trim();
    if (!yaml) return null;
    return { yaml };
  }
}

class FrontmatterVarFormDialog extends FormDialog<FrontmatterVarDialogResult> {
  private fieldsForRender: FormFieldDef[] = [];

  override get title() {
    return "插入变量引用";
  }

  override get hint() {
    return "生成 [[变量路径]]；可选取文档 frontmatter 中已有字段";
  }

  override get className() {
    return "cherry-dialog-form--frontmatter-var";
  }

  override get fields() {
    return this.fieldsForRender;
  }

  override render(
    host: HTMLElement,
    props: Record<string, unknown>,
    callbacks: DialogCallbacks<FrontmatterVarDialogResult>,
  ): () => void {
    const vars = (props.frontmatterVars as string[] | undefined) ?? [];

    if (vars.length > 0) {
      this.fieldsForRender = [
        {
          name: "selectedVar",
          label: "选择已有变量",
          type: "select",
          required: true,
          options: [
            ...vars.map((name) => ({ value: name, label: name })),
            { value: "__NEW__", label: "自定义路径…" },
          ],
        },
        {
          name: "customVar",
          label: "变量路径",
          type: "text",
          hidden: true,
          placeholder: "title 或 author.name",
        },
      ];
    } else {
      this.fieldsForRender = [
        {
          name: "customVar",
          label: "变量路径",
          type: "text",
          required: true,
          placeholder: "title 或 author.name",
          defaultValue: "title",
        },
      ];
    }

    return super.render(host, props, callbacks);
  }

  toResult(
    raw: Record<string, string | boolean>,
  ): FrontmatterVarDialogResult | null {
    let path = String(raw.selectedVar ?? "");
    if (!path || path === "__NEW__") {
      path = String(raw.customVar ?? "").trim();
    }
    if (!path) return null;
    return { path };
  }

  override onMount(form: HTMLFormElement) {
    const select = form.elements.namedItem("selectedVar");
    const customInput = form.elements.namedItem("customVar");
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

const frontmatterFormDialog = new FrontmatterFormDialog();
const frontmatterVarFormDialog = new FrontmatterVarFormDialog();

/**
 * `frontmatter` — 打开 YAML 编辑器；若文档已有 frontmatter 则预填并替换。
 */
export class FrontmatterCommand implements Command, DialogCapableCommand {
  readonly dialogType: DialogType = "frontmatter";

  renderDialog = frontmatterFormDialog.render.bind(frontmatterFormDialog);

  async execute(
    view: EditorView,
    _p: unknown,
    ctx: CommandContext,
  ): Promise<boolean> {
    if (!ctx?.eventBus) return false;
    const doc = view.state.doc.toString();
    const match = doc.match(/^---\n([\s\S]*?)\n---/);
    const data = await requestDialog(ctx.eventBus, "frontmatter", {
      yaml: match?.[1] ?? undefined,
    });
    if (!data) return false;
    insertAtDocumentTop(view, frontmatterMarkdown(data.yaml));
    return true;
  }
}

/**
 * `frontmatterVar` — 插入 frontmatter 变量引用 `[[path]]`，可选取已有键。
 */
export class FrontmatterVarCommand implements Command, DialogCapableCommand {
  readonly dialogType: DialogType = "frontmatterVar";

  renderDialog = frontmatterVarFormDialog.render.bind(frontmatterVarFormDialog);

  async execute(
    view: EditorView,
    _p: unknown,
    ctx: CommandContext,
  ): Promise<boolean> {
    if (!ctx?.eventBus) return false;

    const vars = collectFrontmatterVars(ctx.getStore?.());
    const { from, to, empty } = view.state.selection.main;
    const selected = empty ? "" : view.state.sliceDoc(from, to).trim();

    const props: Record<string, unknown> = { frontmatterVars: vars };
    if (selected && vars.includes(selected)) {
      props.selectedVar = selected;
    } else if (selected) {
      props.customVar = selected;
    }

    const data = (await requestDialog(
      ctx.eventBus,
      "frontmatterVar",
      props,
    )) as FrontmatterVarDialogResult | null;
    if (!data) return false;
    insertText(view, `[[${data.path}]]`);
    return true;
  }
}

/** `frontmatter` 命令实例 */
export const frontmatterCommand = new FrontmatterCommand();
/** `frontmatterVar` 命令实例 */
export const frontmatterVarCommand = new FrontmatterVarCommand();
