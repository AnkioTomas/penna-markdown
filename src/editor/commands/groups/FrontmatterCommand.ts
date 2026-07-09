/**
 * Frontmatter（文档头 YAML）命令。
 * 在文档顶部插入或替换 `---\n...\n---` 块，提交前校验 YAML 语法。
 */
import type { EditorView } from "@codemirror/view";
import YAML from "yaml";
import { requestDialog } from "@/editor/dialog/requestDialog.js";
import { FormDialog } from "@/editor/dialog/FormDialog.js";
import {
  Command,
  insertAtDocumentTop,
  insertText,
  type CommandContext,
} from "@/editor/commands/Command";
import type { DialogCapableCommand } from "@/editor/commands/DialogCommand";
import type { DialogType } from "@/editor/commands/dialogTypes";

/** `frontmatter` 弹窗提交结果。 */
export interface FrontmatterDialogResult {
  yaml: string;
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

const frontmatterFormDialog = new FrontmatterFormDialog();

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
    if (!ctx?.theme) return false;
    const doc = view.state.doc.toString();
    const match = doc.match(/^---\n([\s\S]*?)\n---/);
    const data = await requestDialog(ctx.theme, "frontmatter", {
      yaml: match?.[1] ?? undefined,
    });
    if (!data) return false;
    insertAtDocumentTop(view, frontmatterMarkdown(data.yaml));
    return true;
  }
}

/** `frontmatter` 命令实例 */
export const frontmatterCommand = new FrontmatterCommand();

/**
 * `frontmatterVar` — 插入 frontmatter 变量引用 `[[name]]`。
 * 空选区时插入占位符并选中变量名以便直接编辑。
 */
export class FrontmatterVarCommand implements Command {
  execute(view: EditorView): boolean {
    const { from, to, empty } = view.state.selection.main;
    if (!empty) {
      const selected = view.state.sliceDoc(from, to);
      insertText(view, `[[${selected}]]`);
      return true;
    }
    insertText(view, "[[变量名]]", 2, 5);
    return true;
  }
}

/** `frontmatterVar` 命令实例 */
export const frontmatterVarCommand = new FrontmatterVarCommand();
