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

/**
 * 生成可选的卡片属性片段。
 * @param name - 属性名
 * @param value - 待写入的属性值
 * @returns 值为空时为空字符串，否则返回转义后的属性
 */
function attr(name: string, value: string | undefined): string {
  const v = String(value ?? "").trim();
  return v ? ` ${name}="${v.replace(/"/g, '\\"')}"` : "";
}

/**
 * 解析并限制正整数表单字段。
 * @param raw - 待解析的原始文本
 * @param fallback - 输入无效时使用的默认值
 * @param max - 可选的最大允许值
 * @returns 介于有效范围内的正整数
 */
function parsePositiveInt(raw: string, fallback: number, max?: number): number {
  const n = Number.parseInt(String(raw ?? "").trim(), 10);
  if (Number.isNaN(n) || n < 1) return fallback;
  return max != null ? Math.min(n, max) : n;
}

/**
 * 根据网格列配置生成 `cols` 属性。
 * @param data - 网格卡片表单数据
 * @returns 均匀或响应式列配置的属性片段
 */
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

/**
 * 生成指定数量的默认卡片子项。
 * @param count - 要生成的占位卡片数量
 * @returns 以空行分隔的卡片 Markdown
 */
function renderCardItemsPlaceholders(count: number): string {
  const items: string[] = [];
  for (let i = 1; i <= count; i++) {
    items.push(`::: card 卡片 ${i}\n内容\n:::`);
  }
  return items.join("\n\n");
}

/**
 * 根据 variant 生成卡片 Markdown。
 * @param data - 已校验的卡片表单数据
 * @returns 可插入编辑器的卡片 Markdown
 */
export function cardMarkdown(data: CardDialogResult): string {
  switch (data.variant) {
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

class LinkCardFormDialog extends FormDialog<LinkCardDialogResult> {
  /** 返回链接卡片弹窗标题。 */
  override get title() {
    return VARIANT_LABELS.link;
  }

  /** 返回链接卡片配置提示。 */
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

  /**
   * 将链接卡片表单转换为插入数据。
   * @param raw - 表单提交的字段值
   * @returns 标题或链接为空时返回 null
   */
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
  /** 返回图片卡片弹窗标题。 */
  override get title() {
    return VARIANT_LABELS.image;
  }

  /** 返回图片描述优先级提示。 */
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

  /**
   * 将图片卡片表单转换为插入数据。
   * @param raw - 表单提交的字段值
   * @returns 图片地址或标题为空时返回 null
   */
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
  /** 返回仓库卡片弹窗标题。 */
  override get title() {
    return VARIANT_LABELS.repo;
  }

  /** 返回仓库标识格式提示。 */
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

  /**
   * 校验仓库标识包含 owner/repo 分隔符。
   * @param raw - 表单提交的字段值
   * @returns 格式有效时返回 null，否则返回错误信息
   */
  override validate(raw: Record<string, string | boolean>): string | null {
    const repo = String(raw.repo ?? "").trim();
    if (!repo.includes("/")) return "仓库格式须为 owner/repo";
    return null;
  }

  /**
   * 将仓库卡片表单转换为插入数据。
   * @param raw - 表单提交的字段值
   * @returns 仓库标识为空时返回 null
   */
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
  /** 返回网格卡片弹窗标题。 */
  override get title() {
    return VARIANT_LABELS.grid;
  }
  /** 返回响应式列配置提示。 */
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

  /**
   * 将网格列数字段转换为受限配置。
   * @param raw - 表单提交的字段值
   * @returns 含默认列数的网格配置
   */
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
  /** 返回瀑布流卡片弹窗标题。 */
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

  /**
   * 将瀑布流列数和间距转换为受限配置。
   * @param raw - 表单提交的字段值
   * @returns 含默认列数和间距的瀑布流配置
   */
  toResult(
    raw: Record<string, string | boolean>,
  ): MasonryCardDialogResult | null {
    const cols = parsePositiveInt(String(raw.cols ?? ""), 3, 3);
    const gap = parsePositiveInt(String(raw.gap ?? ""), 16);
    return { variant: "masonry", cols, gap };
  }
}

const CARD_FORMS: Record<
  Exclude<CardVariant, "basic">,
  FormDialog<CardDialogResult>
> = {
  link: new LinkCardFormDialog(),
  image: new ImageCardFormDialog(),
  repo: new RepoCardFormDialog(),
  grid: new GridCardFormDialog(),
  masonry: new MasonryCardFormDialog(),
};

/**
 * 按 `props.variant` 选择对应表单渲染。
 * 六个 command 共用此渲染器，避免互相覆盖。
 * @param host - 弹窗内容挂载元素
 * @param props - 包含卡片变体的弹窗预填充属性
 * @param callbacks - 提交或取消的回调
 * @returns 关闭弹窗时调用的清理函数
 */
export function renderCardDialog(
  host: HTMLElement,
  props: Record<string, unknown>,
  callbacks: DialogCallbacks<CardDialogResult>,
): () => void {
  const variant = props.variant as Exclude<CardVariant, "basic">;
  const form = CARD_FORMS[variant];
  if (!form) throw new Error(`Unsupported card dialog variant: ${variant}`);
  return form.render(host, props, callbacks);
}

/**
 * 插入基础卡片，或请求指定高级卡片的表单。
 * @param view - 要修改的 CodeMirror 编辑器实例
 * @param ctx - 提供事件总线的命令上下文
 * @param variant - 要插入的卡片变体
 * @returns 用户取消或缺少事件总线时返回 false
 */
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

  /**
   * 创建固定卡片变体的命令。
   * @param variant - 传给共享表单的卡片变体
   */
  constructor(private readonly variant: CardVariant) {}

  /**
   * 插入该命令固定的卡片变体。
   * @param view - 要修改的 CodeMirror 编辑器实例
   * @param _payload - 未使用的命令参数
   * @param ctx - 提供事件总线的命令上下文
   * @returns 卡片插入结果
   */
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
