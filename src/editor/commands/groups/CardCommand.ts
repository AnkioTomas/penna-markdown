/**
 * 卡片命令组。
 * 六种 variant 共用 `card` 弹窗类型，按 `props.variant` 渲染各自独立的表单。
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

/** 卡片变体，固化在命令名中（如 `linkCard` → `link`）。 */
export type CardVariant =
  "basic" | "link" | "image" | "repo" | "grid" | "masonry";

export interface CardItem {
  title: string;
  content: string;
}

export interface BasicCardDialogResult {
  variant: "basic";
  title: string;
  content: string;
}

export interface LinkCardDialogResult {
  variant: "link";
  title: string;
  link: string;
  icon?: string;
  content: string;
}

export interface ImageCardDialogResult {
  variant: "image";
  image: string;
  title: string;
  href?: string;
  author?: string;
  date?: string;
  /** 属性描述；与正文二选一或同时存在时正文优先渲染 */
  description?: string;
  content?: string;
}

export interface RepoCardDialogResult {
  variant: "repo";
  repo: string;
  link?: string;
  visibility: string;
  content: string;
}

export interface GridCardDialogResult {
  variant: "grid";
  colsMode: "uniform" | "responsive";
  colsUniform?: number;
  colsSm?: number;
  colsMd?: number;
  colsLg?: number;
}

export interface MasonryCardDialogResult {
  variant: "masonry";
  cols: number;
  gap: number;
}

/** `card` 弹窗提交结果。 */
export type CardDialogResult =
  | BasicCardDialogResult
  | LinkCardDialogResult
  | ImageCardDialogResult
  | RepoCardDialogResult
  | GridCardDialogResult
  | MasonryCardDialogResult;

const VARIANT_LABELS: Record<CardVariant, string> = {
  basic: "基础卡片",
  link: "链接卡片",
  image: "图片卡片",
  repo: "仓库卡片",
  grid: "卡片网格",
  masonry: "瀑布流",
};

const CONTENT_FIELD: FormFieldDef = {
  name: "content",
  label: "正文",
  type: "textarea",
  rows: 4,
  placeholder: "卡片正文（支持 Markdown）",
  defaultValue: "卡片正文",
};

function attr(name: string, value: string | undefined): string {
  const v = String(value ?? "").trim();
  return v ? ` ${name}="${v.replace(/"/g, '\\"')}"` : "";
}

function parsePositiveInt(raw: string, fallback: number, max?: number): number {
  const n = Number.parseInt(String(raw ?? "").trim(), 10);
  if (Number.isNaN(n) || n < 1) return fallback;
  return max != null ? Math.min(n, max) : n;
}

function gridColsAttr(data: GridCardDialogResult): string {
  if (data.colsMode === "uniform" && data.colsUniform) {
    return ` cols="${data.colsUniform}"`;
  }
  if (data.colsMode === "responsive") {
    const sm = data.colsSm ?? 1;
    const md = data.colsMd ?? 2;
    const lg = data.colsLg ?? 3;
    return ` cols="{ sm: ${sm}, md: ${md}, lg: ${lg} }"`;
  }
  return "";
}

function renderCardItemsPlaceholders(count: number): string {
  const items: string[] = [];
  for (let i = 1; i <= count; i++) {
    items.push(`::: card 卡片 ${i}\n内容\n:::`);
  }
  return items.join("\n\n");
}

/** 根据 variant 生成卡片 Markdown。 */
export function cardMarkdown(data: CardDialogResult): string {
  switch (data.variant) {
    case "basic":
      // 基础卡片改为直接插入，不通过 dialogResult
      return `::: card 卡片标题\n内容\n:::\n`;
    case "link": {
      const head = `::: link-card ${data.title}${attr("link", data.link)}${attr("icon", data.icon)}`;
      return `${head}\n${data.content}\n:::\n`;
    }
    case "image": {
      const head = [
        "::: image-card",
        attr("image", data.image),
        attr("title", data.title),
        attr("href", data.href),
        attr("author", data.author),
        attr("date", data.date),
        attr("description", data.description),
      ].join("");
      const body = data.content?.trim() ?? "";
      return body ? `${head}\n${body}\n:::\n` : `${head}\n:::\n`;
    }
    case "repo": {
      const head = `::: repo-card ${data.repo}${attr("visibility", data.visibility !== "Public" ? data.visibility : undefined)}${attr("link", data.link)}`;
      return `${head}\n${data.content}\n:::\n`;
    }
    case "grid":
      return `:::: card-grid${gridColsAttr(data)}\n\n${renderCardItemsPlaceholders(2)}\n\n::::\n`;
    case "masonry": {
      const head = `:::: card-masonry cols="${data.cols}" gap="${data.gap}"`;
      const body = renderCardItemsPlaceholders(2);
      return `${head}\n\n${body}\n\n::::\n`;
    }
  }
}

class BasicCardFormDialog extends FormDialog<BasicCardDialogResult> {
  override get title() {
    return VARIANT_LABELS.basic;
  }
  readonly fields: FormFieldDef[] = [];
  toResult(): BasicCardDialogResult | null {
    return null;
  }
}

class LinkCardFormDialog extends FormDialog<LinkCardDialogResult> {
  override get title() {
    return VARIANT_LABELS.link;
  }

  override get hint() {
    return "整卡可点击跳转；icon 为左侧小图，也可用 image 别名";
  }

  readonly fields: FormFieldDef[] = [
    {
      name: "title",
      label: "标题",
      type: "text",
      required: true,
      placeholder: "链接标题",
      defaultValue: "链接标题",
    },
    {
      name: "link",
      label: "链接",
      type: "url",
      required: true,
      placeholder: "https://example.com",
    },
    {
      name: "icon",
      label: "图标（可选）",
      type: "url",
      placeholder: "https://example.com/icon.png",
    },
    CONTENT_FIELD,
  ];

  toResult(raw: Record<string, string | boolean>): LinkCardDialogResult | null {
    const title = String(raw.title ?? "").trim();
    const link = String(raw.link ?? "").trim();
    if (!title || !link) return null;
    const icon = String(raw.icon ?? "").trim();
    return {
      variant: "link",
      title,
      link,
      icon: icon || undefined,
      content: String(raw.content ?? "").trim() || "链接卡片描述",
    };
  }
}

class ImageCardFormDialog extends FormDialog<ImageCardDialogResult> {
  override get title() {
    return VARIANT_LABELS.image;
  }

  override get hint() {
    return "description 为属性描述；正文区域可作为备用描述段落";
  }

  readonly fields: FormFieldDef[] = [
    {
      name: "image",
      label: "图片地址",
      type: "url",
      required: true,
      placeholder: "https://example.com/photo.webp",
    },
    {
      name: "title",
      label: "标题",
      type: "text",
      required: true,
      placeholder: "图片标题",
      defaultValue: "图片标题",
    },
    {
      name: "href",
      label: "标题链接（可选）",
      type: "url",
      placeholder: "https://example.com",
    },
    {
      name: "author",
      label: "作者（可选）",
      type: "text",
      placeholder: "Andreas Kunz",
    },
    {
      name: "date",
      label: "日期（可选）",
      type: "text",
      placeholder: "2024/08/16",
    },
    {
      name: "description",
      label: "描述属性（可选）",
      type: "text",
      placeholder: "简短描述",
    },
    {
      name: "content",
      label: "正文描述（可选）",
      type: "textarea",
      rows: 3,
      placeholder: "较长描述段落，优先于 description 属性渲染",
    },
  ];

  toResult(
    raw: Record<string, string | boolean>,
  ): ImageCardDialogResult | null {
    const image = String(raw.image ?? "").trim();
    const title = String(raw.title ?? "").trim();
    if (!image || !title) return null;
    const href = String(raw.href ?? "").trim();
    const author = String(raw.author ?? "").trim();
    const date = String(raw.date ?? "").trim();
    const description = String(raw.description ?? "").trim();
    const content = String(raw.content ?? "").trim();
    return {
      variant: "image",
      image,
      title,
      href: href || undefined,
      author: author || undefined,
      date: date || undefined,
      description: description || undefined,
      content: content || undefined,
    };
  }
}

class RepoCardFormDialog extends FormDialog<RepoCardDialogResult> {
  override get title() {
    return VARIANT_LABELS.repo;
  }

  override get hint() {
    return "仓库格式 owner/repo，如 vuepress/ecosystem";
  }

  readonly fields: FormFieldDef[] = [
    {
      name: "repo",
      label: "仓库",
      type: "text",
      required: true,
      placeholder: "owner/repo",
      defaultValue: "owner/repo",
    },
    {
      name: "link",
      label: "自定义链接（可选）",
      type: "url",
      placeholder: "默认 https://github.com/owner/repo",
    },
    {
      name: "visibility",
      label: "可见性",
      type: "select",
      options: [
        { value: "Public", label: "Public" },
        { value: "Private", label: "Private" },
      ],
      defaultValue: "Public",
    },
    {
      name: "content",
      label: "仓库描述",
      type: "textarea",
      rows: 3,
      defaultValue: "仓库描述",
    },
  ];

  override validate(raw: Record<string, string | boolean>): string | null {
    const repo = String(raw.repo ?? "").trim();
    if (!repo.includes("/")) return "仓库格式须为 owner/repo";
    return null;
  }

  toResult(raw: Record<string, string | boolean>): RepoCardDialogResult | null {
    const repo = String(raw.repo ?? "").trim();
    if (!repo) return null;
    const link = String(raw.link ?? "").trim();
    return {
      variant: "repo",
      repo,
      link: link || undefined,
      visibility: String(raw.visibility ?? "Public"),
      content: String(raw.content ?? "").trim() || "仓库描述",
    };
  }
}

class GridCardFormDialog extends FormDialog<GridCardDialogResult> {
  override get title() {
    return VARIANT_LABELS.grid;
  }
  override get hint() {
    return "响应式列数可分别设置 sm/md/lg";
  }

  readonly fields: FormFieldDef[] = [
    {
      name: "colsMode",
      label: "列数模式",
      type: "select",
      options: [
        { value: "responsive", label: "响应式列数" },
        { value: "uniform", label: "统一列数" },
      ],
      defaultValue: "responsive",
    },
    {
      name: "colsUniform",
      label: "统一列数（1–3）",
      type: "text",
      placeholder: "2",
      defaultValue: "2",
    },
    {
      name: "colsSm",
      label: "小屏列数 sm",
      type: "text",
      placeholder: "1",
      defaultValue: "1",
    },
    {
      name: "colsMd",
      label: "中屏列数 md",
      type: "text",
      placeholder: "2",
      defaultValue: "2",
    },
    {
      name: "colsLg",
      label: "大屏列数 lg",
      type: "text",
      placeholder: "3",
      defaultValue: "3",
    },
  ];

  toResult(raw: Record<string, string | boolean>): GridCardDialogResult | null {
    const colsMode = String(
      raw.colsMode ?? "responsive",
    ) as GridCardDialogResult["colsMode"];
    return {
      variant: "grid",
      colsMode,
      colsUniform:
        colsMode === "uniform"
          ? parsePositiveInt(String(raw.colsUniform ?? ""), 2, 3)
          : undefined,
      colsSm:
        colsMode === "responsive"
          ? parsePositiveInt(String(raw.colsSm ?? ""), 1, 3)
          : undefined,
      colsMd:
        colsMode === "responsive"
          ? parsePositiveInt(String(raw.colsMd ?? ""), 2, 3)
          : undefined,
      colsLg:
        colsMode === "responsive"
          ? parsePositiveInt(String(raw.colsLg ?? ""), 3, 3)
          : undefined,
    };
  }
}

class MasonryCardFormDialog extends FormDialog<MasonryCardDialogResult> {
  override get title() {
    return VARIANT_LABELS.masonry;
  }

  readonly fields: FormFieldDef[] = [
    {
      name: "cols",
      label: "列数（1–3）",
      type: "text",
      required: true,
      placeholder: "3",
      defaultValue: "3",
    },
    {
      name: "gap",
      label: "间距（px）",
      type: "text",
      required: true,
      placeholder: "16",
      defaultValue: "16",
    },
  ];

  toResult(
    raw: Record<string, string | boolean>,
  ): MasonryCardDialogResult | null {
    const cols = parsePositiveInt(String(raw.cols ?? ""), 3, 3);
    const gap = parsePositiveInt(String(raw.gap ?? ""), 16);
    return { variant: "masonry", cols, gap };
  }
}

const CARD_FORMS: Record<CardVariant, FormDialog<CardDialogResult>> = {
  basic: new BasicCardFormDialog(),
  link: new LinkCardFormDialog(),
  image: new ImageCardFormDialog(),
  repo: new RepoCardFormDialog(),
  grid: new GridCardFormDialog(),
  masonry: new MasonryCardFormDialog(),
};

/**
 * 按 `props.variant` 选择对应表单渲染。
 * 六个 command 共用此渲染器，避免互相覆盖。
 */
export function renderCardDialog(
  host: HTMLElement,
  props: Record<string, unknown>,
  callbacks: DialogCallbacks<CardDialogResult>,
): () => void {
  const variant = (props.variant as CardVariant) ?? "basic";
  const form = CARD_FORMS[variant] ?? CARD_FORMS.basic;
  return form.render(host, props, callbacks);
}

async function insertCard(
  view: EditorView,
  ctx: CommandContext | undefined,
  variant: CardVariant,
): Promise<boolean> {
  const state = view.state;
  const selection = state.selection.main;
  const selectedText = state.sliceDoc(selection.from, selection.to);
  const desc = selectedText ? selectedText : "卡片正文";

  if (variant === "basic") {
    insertSnippet(view, `::: card 卡片标题\n${desc}\n:::\n`);
    return true;
  }

  if (!ctx?.eventBus) return false;
  const data = await requestDialog(ctx.eventBus, "card", { variant });
  if (!data) return false;
  insertSnippet(view, cardMarkdown(data));
  return true;
}

/** 卡片命令，variant 在构造时固定并传入弹窗 props。 */
export class CardCommand implements Command, DialogCapableCommand {
  readonly dialogType: DialogType = "card";

  renderDialog = renderCardDialog;

  constructor(private readonly variant: CardVariant) {}

  execute(
    view: EditorView,
    _payload: unknown,
    ctx: CommandContext,
  ): boolean | Promise<boolean> {
    return insertCard(view, ctx, this.variant);
  }
}

/** `card` — 基础卡片 `::: card 标题` */
export const cardCommand = new CardCommand("basic");
/** `linkCard` — 链接卡片 `::: link-card` */
export const linkCardCommand = new CardCommand("link");
/** `imageCard` — 图片卡片 `::: image-card` */
export const imageCardCommand = new CardCommand("image");
/** `repoCard` — 仓库卡片 `::: repo-card owner/repo` */
export const repoCardCommand = new CardCommand("repo");
/** `cardGrid` — 响应式卡片网格 `:::: card-grid` */
export const cardGridCommand = new CardCommand("grid");
/** `cardMasonry` — 瀑布流布局 `:::: card-masonry` */
export const cardMasonryCommand = new CardCommand("masonry");
