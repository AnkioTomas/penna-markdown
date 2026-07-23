---
title: 编辑器
subtitle: Penna 完整编辑器用法
version: 0.1.0
tags: [guide, editor]
---

# [[title]]

> [[subtitle]] — 工具栏、侧栏、分栏预览、AI / 上传钩子。

---

## 基本用法

```typescript
import { Penna } from "penna-markdown";

const penna = new Penna(document.getElementById("editor")!, {
  layout: "split", // split | edit | preview
  appearance: "light", // light | dark
  themeId: "default",
  themes: ["default", "github", "notion"], // 省略 = 全部内置主题
  debug: false,
  statusbar: true,
  editor: {
    value: "# 标题\n\n正文",
    lineNumbers: true,
  },
  preview: {
    maxWidth: "720px", // 仅「纯预览」布局生效
  },
});

penna.setMarkdown("# 新内容");
const md = penna.getMarkdown();
penna.setLayout("preview");
penna.destroy();
```

---

## PennaOptions

:::: field-group

::: field layout
@type `"split" | "edit" | "preview"`
@default split
初始布局。
:::

::: field appearance
@type `"light" | "dark"`
@default light
明暗模式。
:::

::: field themeId
@type string
@default default
初始皮肤 id。
:::

::: field themes
@type string[]
@optional
主题白名单，控制 `Theme` 与工具栏主题菜单；空数组或省略 = 全部内置主题。
:::

::: field debug
@type boolean
@default false
调试日志；开启后 `theme.logD` 与状态栏渲染耗时才会输出。
:::

::: field toolbar
@type ToolbarOptions | false
@optional
`false` 不实例化工具栏；对象见下方 [ToolbarOptions](#toolbaroptions)。省略则使用默认工具栏。
:::

::: field sidebar
@type SideBarOptions | boolean
@optional
`false` 隐藏侧栏；`true` / 省略显示默认侧栏；对象见下方 [SideBarOptions](#sidebaroptions)。
:::

::: field statusbar
@type boolean
@default true
底部状态栏；`false` 隐藏。
:::

::: field storage
@type StorageAPI
@optional
分栏比例等本地持久化；默认使用 `localStorage`（不可用时回退内存）。接口见下方 [StorageAPI](#storageapi)。
:::

::: field editor
@type EditorOptions
@optional
编辑区选项，见下方 [EditorOptions](#editoroptions)。
:::

::: field preview
@type PreviewOptions
@optional
预览区选项，见下方 [PreviewOptions](#previewoptions)。
:::

::::

---

## EditorOptions

:::: field-group

::: field value
@type string
@optional
初始 Markdown 正文。
:::

::: field lineNumbers
@type boolean
@default true
编辑区是否显示行号。
:::

::: field onAiRequest
@type OnAiRequest
@optional
AI 请求回调。省略时 AI 工具栏命令会静默失败。签名见 [回调类型](#回调类型)。
:::

::: field onAiRequestCancel
@type OnAiRequestCancel
@optional
用户主动取消 AI 请求时的回调（例如关闭生成中的 diff 面板）。
:::

::: field onParseFile
@type OnParseFile
@optional
粘贴或拖入文件时的解析/上传回调。省略时不会发起上传。
:::

::::

---

## PreviewOptions

:::: field-group

::: field maxWidth
@type number | string
@optional
**仅「纯预览」布局**下限制预览版心宽度，例如 `800` 或 `"720px"` / `"50rem"`。分栏与纯编辑布局忽略此值。
:::

::: field transformerEngineOptions
@type TransformerEngineOptions
@optional
预览解析引擎选项（自定义行内/块级 parser、`syntaxOptions`、`isDark` 等）。详见 [`transformer.md`](transformer.md)。**没有**顶层 `transformer` 字段。
:::

::::

---

## ToolbarOptions

:::: field-group

::: field items
@type ToolbarItem[]
@optional
工具栏完整项目列表。传入后**整表替换**默认项（含空数组）；省略则使用 `DEFAULT_TOOLBAR_ITEMS`。基于默认增删请先展开默认表。
:::

::: field onClick
@type (id: string, ctx: ToolbarContext) => void
@optional
自定义按钮全局点击回调，在 `ctx.execute` **之后**旁路调用，**不会替代**命令分发。需要拦截行为时用 `items[].onClick`。
:::

::::

### ToolbarItem

`items` 中每一项为联合类型：`button` | `menu` | `separator`。

:::: field-group

::: field id
@type string
@required
全局唯一 id，用于排序与覆盖。
:::

::: field type
@type `"button" | "menu" | "separator"`
@optional
项目类型；按钮可省略（默认 button）。
:::

::: field label
@type string
@required
按钮或菜单的显示文案（仅 `button` / `menu`）。
:::

::: field title
@type string
@optional
悬停提示。
:::

::: field icon
@type string
@optional
SVG 字符串；未配置时按 `id` 回退默认图标。
:::

::: field mobileOverflow
@type boolean
@optional
为 `true` 时在移动端收进「更多」菜单。
:::

::: field onClick
@type (ctx: ToolbarContext) => void
@optional
仅 `button`：单项点击回调。可调用 `ctx.execute(commandId)` / `ctx.focus()`。
:::

::: field children
@type ToolbarItem[]
@required
仅 `menu`：子菜单项列表。
:::

::::

`ToolbarContext`：

:::: field-group

::: field eventBus
@type EventBus
实例事件总线。
:::

::: field execute
@type (id: string) => void
执行已注册命令。
:::

::: field focus
@type () => void
将焦点交回编辑器。
:::

::::

---

## SideBarOptions

:::: field-group

::: field maxWidth
@type number
@default 300
侧栏最大宽度（px）。
:::

::: field fetchFiles
@type () => Promise<PennaFileItem[]>
@optional
异步获取文件列表。未提供时侧栏**只显示大纲**。
:::

::: field onFileClick
@type (fileId: string) => void
@optional
点击文件列表项时的回调。宿主应自行加载内容并调用 `setSidebarActiveFile`。
:::

::::

### PennaFileItem

:::: field-group

::: field id
@type string
@required
文件唯一标识。
:::

::: field title
@type string
@required
文件名称。
:::

::: field updateTime
@type string
@required
更新时间展示字符串。
:::

::: field summary
@type string
@required
简介或前文预览片段。
:::

::::

---

## StorageAPI

本地存储契约；默认由内部 `createDefaultStorage()` 适配。

:::: field-group

::: field getItem
@type (key: string) => string | null
读取键值。
:::

::: field setItem
@type (key: string, value: string) => void
写入键值。
:::

::::

---

## 回调类型

类型定义在 `EditorOptions`，并由包入口 re-export：

```typescript
import type {
  OnAiRequest,
  OnAiRequestCancel,
  OnParseFile,
} from "penna-markdown";
```

:::: field-group

::: field OnParseFile
@type (file: File) => Promise<{ url: string; msg: string }>
粘贴/拖入文件时由宿主上传或解析，返回可写入文档的 URL 与展示文案。
:::

::: field OnAiRequest
@type (action: string, text: string, prompts?: string, onUpdate?: (contentDelta?: string, thinkingDelta?: string) => void) => Promise<string>
AI 请求。`action` 为内置或自定义操作 id；`text` 为选区（无选区则为全文）；`prompts` 仅「自定义」操作时传入用户输入；`onUpdate` 为流式增量回调（应传 delta，非全文）；最终 `Promise` resolve 为完整替换正文。
:::

::: field OnAiRequestCancel
@type (action: string) => void
用户主动取消进行中的 AI 请求时调用。
:::

::::

---

## 自定义工具栏

`toolbar.items` **整表替换**默认项。省略 `items` 时使用内置默认表；传入（含 `[]`）则完全以你的列表为准。

基于默认项增删/重排时，展开 `DEFAULT_TOOLBAR_ITEMS`：

```typescript
import { Penna, DEFAULT_TOOLBAR_ITEMS } from "penna-markdown";

new Penna(el, {
  toolbar: {
    items: [
      // 去掉「格式」，其余默认保留，末尾追加自定义按钮
      ...DEFAULT_TOOLBAR_ITEMS.filter((item) => item.id !== "textFormat"),
      {
        id: "my-btn",
        type: "button",
        label: "自定义",
        onClick: (ctx) => {
          ctx.execute("bold"); // 或自行处理
          ctx.focus();
        },
      },
    ],
    // 在 ctx.execute 之后旁路通知，不会吞掉内置命令（含 AI）
    onClick: (id) => console.info("toolbar", id),
  },
});
```

> [!IMPORTANT]
> 全局 `toolbar.onClick` **不会替代**命令分发。需要拦截行为时用 `items[].onClick`。
> 只传一个自定义按钮而不展开默认表，工具栏将**只显示**该按钮。

---

## 侧栏文件列表

```typescript
new Penna(el, {
  sidebar: {
    maxWidth: 320,
    fetchFiles: async () => [
      {
        id: "a.md",
        title: "文档 A",
        updateTime: "今天",
        summary: "摘要…",
      },
    ],
    onFileClick: (fileId) => {
      penna.setMarkdown(/* 按 fileId 加载 */);
      penna.setSidebarActiveFile(fileId);
    },
  },
});
```

未提供 `fetchFiles` 时侧栏只显示大纲。

---

## 注入自定义语法

自定义 parser 走 **预览引擎**，不是顶层不存在的 `transformer` 字段：

```typescript
new Penna(el, {
  preview: {
    transformerEngineOptions: {
      inlineParsers: {
        1001: new MyInlineParser(), // priority → parser
      },
      blockParsers: {
        500: new MyBlockParser(),
      },
    },
  },
});
```

详见 [`extend.md`](extend.md) 与 [`transformer.md`](transformer.md)。

---

## AI 与上传

```typescript
new Penna(el, {
  editor: {
    onAiRequest: async (action, text, prompts, onUpdate) => {
      // action: polish | proofread | translate | summarize | custom …
      // onUpdate?.(contentDelta, thinkingDelta) — 流式增量
      return await callYourLLM(action, text, prompts, onUpdate);
    },
    onAiRequestCancel: (action) => {
      abortYourLLM(action);
    },
    onParseFile: async (file) => {
      const url = await upload(file);
      return { url, msg: file.name };
    },
  },
});
```

未配置 `editor.onAiRequest` 时，AI 工具栏命令会静默失败。

---

## 实例方法

属性：`theme`（`Theme`）、`eventBus`、`storage`（见 [`api.md`](api.md)）。

:::: field-group

::: field getMarkdown
@type () => string
读取全文。
:::

::: field setMarkdown
@type (markdown: string) => void
整篇替换。
:::

::: field getLayout
@type () => "split" | "edit" | "preview"
当前布局。
:::

::: field setLayout
@type (mode: EditorLayoutMode) => void
切换布局。
:::

::: field isSidebarVisible
@type () => boolean
侧栏是否可见。
:::

::: field setSidebarVisible
@type (show: boolean) => void
显隐侧栏。
:::

::: field toggleSidebar
@type () => void
切换侧栏。
:::

::: field setSidebarActiveFile
@type (fileId: string) => void
高亮侧栏文件项。
:::

::: field runCommand
@type (command: string, payload?: unknown) => boolean | Promise<boolean>
执行已注册命令。
:::

::: field destroy
@type () => void
销毁实例。
:::

::::

---

## 相关

- [快速开始](getting-started.md) · [主题](themes.md) · [API](api.md) · [架构](architecture.md)
