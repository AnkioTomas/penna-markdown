---
title: API 参考手册
parent: Cherry Markdown Next 设计文档
---

# [[title]]

[← 返回索引](./index.md)

> 本文档描述 **0.1.0** 对外 API。`0.x` 阶段接口可能调整，集成前请锁定版本并跑回归测试。

---

## 包入口与导出

| import 路径 | 主要导出 | IIFE 全局名 |
| --- | --- | --- |
| `cherry-markdown-next` | `Cherry`, `el` | `CherryNextEditor` |
| `cherry-markdown-next/renderer` | `Renderer`, `Theme`, `RenderResult`, 主题事件常量 | `CherryNextRenderer` |
| `cherry-markdown-next/transformer` | `TransformerEngine` | `CherryNextTransformer` |

源码开发（monorepo / 链接 `src`）还可直接引用：

| 模块路径 | 用途 |
| --- | --- |
| `@/editor/commands` | `runCommand`, `applyHeading`, `insertTable`, `insertLink`, `applyBadge` |
| `@/editor/commands/registry` | `registerCommand`, `getCommand`, `listCommands` |
| `@/transformer/core/ParserBase` | `BaseBlockParser`, `BaseInlineParser` |
| `@/transformer/core/MarkdownNode` | `createNode`, `MarkdownNode` |
| `@/editor/dialog/requestDialog` | 对话框 Promise API |

> [!NOTE]
> 发布包 `dist/cherry.min.*` 仅 bundle 入口依赖链上的符号。**自定义命令注册**需在构建前将 `registerCommand` 打进 bundle，或在应用层通过 `cherry.runCommand("insertText", …)` 间接扩展。

---

## Cherry

### 构造

```typescript
import { Cherry } from "cherry-markdown-next";

const cherry = new Cherry(rootEl: HTMLElement, options?: CherryOptions);
```

### 实例属性

:::: field-group
::: field theme
@type Theme
@readonly
事件总线与皮肤运行时；订阅 `editor:ready` 等事件。
:::
::::

### 实例方法

:::: field-group
::: field getMarkdown()
@returns string
返回 CodeMirror 当前文档全文。
:::

::: field setMarkdown(markdown)
@param markdown string
整篇替换文档；内容相同时 no-op。
:::

::: field getLayout()
@returns EditorLayoutMode
当前布局：`split` | `edit` | `preview`。
:::

::: field setLayout(mode)
@param mode EditorLayoutMode
切换布局；同步 Divider 与 UI 状态。
:::

::: field isSidebarVisible()
@returns boolean
侧边栏是否可见。
:::

::: field setSidebarVisible(show)
@param show boolean
显示/隐藏侧边栏；`split` 模式下会刷新分栏。
:::

::: field toggleSidebar()
切换侧边栏显隐。
:::

::: field setSidebarActiveFile(fileId)
@param fileId string
高亮侧栏文件项（多文档场景）。
:::

::: field getEditorView()
@returns EditorView
**高级**：返回 CodeMirror 6 视图；直接改文档会触发 `editor:change`。
:::

::: field runCommand(command, payload?)
@param command string
@param payload unknown
@returns boolean | Promise<boolean>
执行已注册编辑命令；失败返回 `false`。
:::

::: field destroy()
销毁实例：取消订阅、destroy 子模块、移除 DOM、发射 `editor:destroy`。
:::
::::

### 构造选项 CherryOptions

```typescript
interface CherryOptions {
  id?: string;
  layout?: "split" | "edit" | "preview";  // default: "split"
  appearance?: "light" | "dark";           // default: "light"
  themeId?: string;                        // default: "default"
  debug?: boolean;                         // default: false
  toolbar?: ToolbarOptions | false;        // false = 无工具栏
  sidebar?: SideBarOptions | boolean;      // false = 隐藏
  statusbar?: boolean;                     // default: true
  editor?: EditorOptions;
  preview?: PreviewOptions;
  transformer?: TransformerEngineOptions;
}
```

#### EditorOptions

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `string` | `""` | 初始 Markdown |
| `lineNumbers` | `boolean` | `true` | 是否显示行号 |
| `transformerEngineOptions` | `TransformerEngineOptions` | — | 编辑器语法高亮用的解析配置 |

#### PreviewOptions

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `inlineParsers` | `Record<number, BaseInlineParser>` | 覆盖/追加行内 parser |
| `blockParsers` | `Record<number, BaseBlockParser>` | 覆盖/追加块级 parser |

未指定时继承 `CherryOptions.transformer` 中的同名字段。

#### SideBarOptions

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `fetchFiles` | `() => Promise<CherryFileItem[]>` | 提供时显示文件列表 Tab |
| `onFileClick` | `(fileId: string) => void` | 点击文件回调 |

```typescript
interface CherryFileItem {
  id: string;
  title: string;
  updateTime: string;
  summary: string;
}
```

#### ToolbarOptions

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `ToolbarItem[]` | 内置 defaults | 同 `id` 覆盖默认项 |
| `order` | `string[]` | — | 顶层按钮 id 排序 |
| `orderMap` | `Record<string, string[]>` | — | 子菜单内排序 |
| `groups` | `string[][]` | 内置分组 | 工具栏分组 |
| `mobileBreakpoint` | `number` | `640` | 移动端「更多」断点 |

**ToolbarItem** 类型：`button` | `menu` | `separator` | `layout`

```typescript
// 自定义按钮示例
{
  id: "my-cmd",
  label: "★",
  title: "插入星标",
  command: "insertText",
  payload: { text: "⭐" },
}

// 或使用 onClick 完全自定义
{
  id: "custom",
  label: "C",
  onClick: (ctx) => {
    ctx.execute("insertText", { text: "<!-- custom -->\n" });
  },
}
```

---

## Theme

```typescript
import {
  Theme,
  THEME_EVENT_SKIN,
  THEME_EVENT_LIGHT_DARK,
  type ThemeSkinEvent,
  type ThemeLightDarkEvent,
  type LightDark,
} from "cherry-markdown-next/renderer";
```

### 方法

| 方法 | 说明 |
| --- | --- |
| `list()` | 返回已注册主题 id 数组 |
| `setTheme(id, renderEl, rootEl?)` | 切换皮肤；在 render 根加 `cherry-render`，在 root 加 `cherry-theme-{id}` |
| `getTheme()` | `{ id, mode, isDark, render, root }` |
| `setLightDark(mode)` | `"light"` / `"dark"`；root  toggles `cherry-dark` |
| `on(event, handler)` | 订阅；返回取消函数 |
| `once(event, handler)` | 单次订阅 |
| `off(event, handler)` | 取消订阅 |
| `emit(event, payload?)` | 同步广播 |
| `isDebug()` / `logD` / `logW` / `logE` | 日志 |

### 常用事件

完整列表见 [`theme-and-events.md`](./theme-and-events.md)。

| 事件 | 载荷摘要 |
| --- | --- |
| `editor:change` | `{ markdown, tr? }` |
| `editor:ready` | `{ id? }` |
| `editor:destroy` | `{ id? }` |
| `preview:rendered` | `{ markdown, html, ast, blocks, partial?, changedStartLines? }` |
| `cherry:layout` | `{ mode }` |
| `cherry:sidebar` | `{ show }` |
| `editor:command` | `{ command, payload? }` |
| `editor:dialog:open` | `{ id, type, props? }` |
| `editor:dialog:result` | `{ id, cancelled?, data? }` |

---

## Renderer

```typescript
import { Renderer, type RenderResult } from "cherry-markdown-next/renderer";
```

### 构造

```typescript
new Renderer({
  mount: HTMLElement,      // required
  theme: Theme,            // required
  inlineParsers?: Record<number, BaseInlineParser>,
  blockParsers?: Record<number, BaseBlockParser>,
});
```

### 方法

:::: field-group
::: field render(markdown, changes?)
@returns RenderResult
优先增量渲染；失败自动 `renderFull`。
@param changes CherryChangeLineSet[] 可选，来自 CM 变更
:::

::: field renderFull(markdown)
@returns RenderResult
强制全量 parse + DOM 替换。
:::

::: field getToc()
@returns TocItem[]
嵌套 TOC 树。
:::

::: field getTocFlat()
@returns TocFlatItem[]
扁平 TOC 列表。
:::

::: field getMountedBlocks()
@returns BlockIndex[]
当前 mount 子元素对应的块索引。
:::

::: field getMount()
@returns HTMLElement
预览挂载点。
:::

::: field destroy()
取消主题订阅、清空 session、销毁 CodeListener。
:::
::::

### RenderResult

```typescript
interface RenderResult {
  html: string;
  ast: MarkdownNode;
  blocks: BlockIndex[];
  partial?: boolean;           // true = 增量成功
  changedStartLines?: number[];
}
```

---

## TransformerEngine

```typescript
import { TransformerEngine } from "cherry-markdown-next/transformer";
```

### 构造选项 TransformerEngineOptions

```typescript
interface TransformerEngineOptions {
  inlineParsers?: Record<number, BaseInlineParser>;
  blockParsers?: Record<number, BaseBlockParser>;
  syntaxOptions?: Record<string, Record<string, unknown>>;
  renderOptions?: Record<string, unknown>;
  isDark?: boolean;
}
```

**syntaxOptions 示例**：

```typescript
{
  syntaxOptions: {
    atx_heading: { slug: true },   // 标题生成 id，供 TOC / 锚点
    code: {
      enable: true,
      highlightJs: (code, lang) => string,  // Renderer 内置 hljs
    },
  },
  renderOptions: {
    sourceLineMap: true,  // 块根元素输出 data-hash（增量必需）
  },
}
```

### 方法

| 方法 | 说明 |
| --- | --- |
| `parse(markdown)` | 全量 parse → AST 根 |
| `parseIncremental(prevAst, markdown, range)` | 增量 parse，原地更新 AST |
| `render(ast)` | AST → 完整 HTML 字符串 |
| `renderBlock(node, ast)` | 单块 HTML（增量 DOM 刷新） |
| `renderBlockWithContext(node, ctx)` | 在已有 ctx 下渲染单块 |
| `createRenderContext(store)` | 创建 RenderContext |
| `registry` | 语法 Registry 只读引用 |
| `isDark` | 可读写，影响公式/图表主题 |

---

## 命令 API

### runCommand

```typescript
import { runCommand } from "@/editor/commands";  // 源码路径

runCommand(
  view: EditorView,
  command: string,
  payload?: unknown,
  ctx?: { theme?: Theme },
): boolean | Promise<boolean>;
```

通过 `Cherry` 调用时无需自行传 `view`：

```typescript
await cherry.runCommand("bold");
await cherry.runCommand("insertText", { text: "hello", selectFrom: 0, selectTo: 5 });
```

### 内置命令一览

| 命令 | payload | 异步 |
| --- | --- | --- |
| `bold` / `italic` / `strikethrough` / `code` | — | 否 |
| `heading1` … `heading6` | — | 否 |
| `blockquote` / `unorderedList` / `orderedList` / `taskList` | — | 否 |
| `horizontalRule` / `codeBlock` / `image` | — | 否 |
| `insertText` | `string` 或 `InsertTextPayload` | 否 |
| `link` | — | 是（对话框） |
| `table` | — | 是（对话框） |
| `badge` | — | 是（对话框） |

### InsertTextPayload

```typescript
interface InsertTextPayload {
  text: string;
  selectFrom?: number;  // 插入后选区起点（相对插入文本）
  selectTo?: number;
}
```

### 对话框结果类型

```typescript
interface TableDialogResult { rows: number; cols: number; }
interface LinkDialogResult { text: string; url: string; title?: string; }
interface BadgeDialogResult {
  text: string;
  variant: "note" | "tip" | "important" | "warning" | "caution" | "danger";
  position?: "middle" | "top" | "bottom";
}
```

### requestDialog（扩展异步命令）

```typescript
import { requestDialog } from "@/editor/dialog/requestDialog";

const data = await requestDialog(theme, "link", { text: "...", url: "..." });
if (!data) return false; // 用户取消
```

---

## 完整集成示例

```typescript
import { Cherry } from "cherry-markdown-next";
import "cherry-markdown-next/cherry-editor-base.min.css";
import "cherry-markdown-next/cherry-theme-github-editor.min.css";
import "cherry-markdown-next/cherry-theme-github-render.min.css";

const cherry = new Cherry(document.getElementById("app")!, {
  themeId: "github",
  appearance: "light",
  layout: "split",
  debug: false,
  editor: { value: "# Title\n\nEdit me." },
  toolbar: {
    groups: [
      ["bold", "italic", "code"],
      ["heading", "link", "table"],
    ],
  },
  sidebar: {
    fetchFiles: async () => [],
    onFileClick: (id) => console.log(id),
  },
  transformer: {
    syntaxOptions: { atx_heading: { slug: true } },
    renderOptions: { sourceLineMap: true },
  },
});

cherry.theme.on("editor:ready", () => {
  console.log("ready");
});

cherry.theme.on("preview:rendered", ({ ast, partial }) => {
  console.log("rendered", partial ? "incremental" : "full");
});
```

---

## 类型索引

| 类型 | 定义位置 |
| --- | --- |
| `CherryOptions` | `src/editor/CherryOptions.ts` |
| `EditorLayoutMode` | `src/editor/Layout.ts` |
| `MarkdownNode` | `src/transformer/core/MarkdownNode.ts` |
| `BaseBlockParser` / `BaseInlineParser` | `src/transformer/core/ParserBase.ts` |
| `TocItem` / `TocFlatItem` | `src/renderer/toc/extract.ts` |
| `BlockIndex` | `src/renderer/incremental/BlockIndex.ts` |
| `CherryChangeLineSet` | `src/renderer/incremental/CherryChangeSet.ts` |

---

[← 索引](./index.md) · [自定义语法 Cookbook →](./syntax-extension-cookbook.md)
