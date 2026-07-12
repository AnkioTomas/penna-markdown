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

/**
 * 校验 YAML 字符串，无效时返回错误文案。
 * @param yaml - 待解析的 YAML 文本
 * @returns YAML 有效时返回 null，否则返回错误信息
 */
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

/**
 * 包装为 frontmatter 围栏 Markdown。
 * @param yaml - 要包裹的 YAML 文本
 * @returns 带首尾围栏和空行的 frontmatter Markdown
 */
export function frontmatterMarkdown(yaml: string): string {
  return `---\n${yaml.trim()}\n---\n\n`;
}

/**
 * 将 frontmatter 对象展平为点分路径列表（供 [[path]] 引用）。
 * @param obj - 待遍历的 frontmatter 对象
 * @param prefix - 当前递归层级的路径前缀
 * @returns 排序后的叶子字段路径列表
 */
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

/**
 * 从 ParserStore 读取 frontmatter 变量路径。
 * @param store - 最近一次渲染生成的可选 ParserStore
 * @returns 可用于变量引用的点分字段路径
 */
export function collectFrontmatterVars(
  store: ParserStore | null | undefined,
): string[] {
  if (!store?.has("frontMatter")) return [];
  const data = store.get<Record<string, unknown>>("frontMatter");
  if (!data || typeof data !== "object") return [];
  return flattenFrontmatterKeys(data);
}

class FrontmatterFormDialog extends FormDialog<FrontmatterDialogResult> {
  /** 返回 frontmatter 编辑弹窗标题。 */
  override get title() {
    return "文档头（YAML）";
  }

  /** 返回替换文档头的提示信息。 */
  override get hint() {
    return "插入到文档顶部，替换已有 frontmatter";
  }

  /** 返回提交按钮文案。 */
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

  /**
   * 为首次打开的表单补充默认 YAML。
   * @param props - 调用方传入的预填充属性
   * @returns 保留原属性并补齐默认 YAML 的属性
   */
  override prepareProps(
    props: Record<string, unknown>,
  ): Record<string, unknown> {
    return {
      ...props,
      yaml: props.yaml ?? `title: 标题\ndescription: 描述\n`,
    };
  }

  /**
   * 校验 YAML 文本。
   * @param raw - 表单提交的字段值
   * @returns YAML 有效时返回 null，否则返回错误信息
   */
  override validate(raw: Record<string, string | boolean>): string | null {
    return validateFrontmatterYaml(String(raw.yaml ?? ""));
  }

  /**
   * 将表单字段转换为 frontmatter 数据。
   * @param raw - 表单提交的字段值
   * @returns YAML 为空时返回 null
   */
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

  /** 返回变量引用弹窗标题。 */
  override get title() {
    return "插入变量引用";
  }

  /** 返回变量引用语法提示。 */
  override get hint() {
    return "生成 [[变量路径]]；可选取文档 frontmatter 中已有字段";
  }

  /** 返回变量引用表单的样式类名。 */
  override get className() {
    return "cherry-dialog-form--frontmatter-var";
  }

  /** 返回本次渲染动态构建的字段列表。 */
  override get fields() {
    return this.fieldsForRender;
  }

  /**
   * 根据已有变量路径构造选择字段后渲染表单。
   * @param host - 弹窗内容挂载元素
   * @param props - 包含已有变量路径的预填充属性
   * @param callbacks - 提交或取消的回调
   * @returns 父表单提供的清理函数
   */
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

  /**
   * 从已有选择或自定义输入中解析变量路径。
   * @param raw - 表单提交的字段值
   * @returns 路径为空时返回 null
   */
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

  /**
   * 同步“自定义路径”输入框的显隐和必填状态。
   * @param form - 已挂载的表单元素
   * @returns 可选的事件监听清理函数
   */
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

  /**
   * 打开 YAML 表单并替换或插入文档头。
   * @param view - 要修改的 CodeMirror 编辑器实例
   * @param _p - 未使用的命令参数
   * @param ctx - 提供事件总线的命令上下文
   * @returns 用户取消或缺少事件总线时返回 false
   */
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

  /**
   * 从 AST 收集变量路径，打开表单并插入变量引用。
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
