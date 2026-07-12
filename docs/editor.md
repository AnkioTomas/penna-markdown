---
title: 编辑器
subtitle: Cherry 完整编辑器用法
version: 0.1.0
tags: [guide, editor]
---

# [[title]]

> [[subtitle]] — 工具栏、侧栏、分栏预览、AI / 上传钩子。

---

## 基本用法

```typescript
import { Cherry } from "cherry-markdown-next";

const cherry = new Cherry(document.getElementById("editor")!, {
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

cherry.setMarkdown("# 新内容");
const md = cherry.getMarkdown();
cherry.setLayout("preview");
cherry.destroy();
```

---

## 构造选项一览

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
主题白名单；空数组或省略 = 全部内置主题。
:::

::: field debug
@type boolean
@default false
调试日志与状态栏渲染耗时。
:::

::: field toolbar
@type ToolbarOptions | false
@optional
`false` 关闭工具栏；`items` 为整表替换（省略则用默认表）。基于默认增删请展开 `DEFAULT_TOOLBAR_ITEMS`。
:::

::: field sidebar
@type SideBarOptions | boolean
@optional
`false` 隐藏；对象可配 `fetchFiles` / `onFileClick` / `maxWidth`。
:::

::: field statusbar
@type boolean
@default true
底部状态栏。
:::

::: field storage
@type StorageAPI
@optional
分栏比例等本地持久化；默认 `localStorage`。
:::

::: field onAiRequest
@type OnAiRequest
@optional
AI 请求；与 `editor.onAiRequest` 等价，**editor 内优先**。
:::

::: field onParseFile
@type OnParseFile
@optional
粘贴/拖入文件上传；与 `editor.onParseFile` 等价，**editor 内优先**。
:::

::: field editor
@type EditorOptions
@optional
`value` / `lineNumbers` / `onAiRequest` / `onParseFile`。
:::

::: field preview
@type PreviewOptions
@optional
`maxWidth` / `transformerEngineOptions`。
:::

::::

---

## 自定义工具栏

`toolbar.items` **整表替换**默认项。省略 `items` 时使用内置默认表；传入（含 `[]`）则完全以你的列表为准。

基于默认项增删/重排时，展开 `DEFAULT_TOOLBAR_ITEMS`：

```typescript
import { Cherry, DEFAULT_TOOLBAR_ITEMS } from "cherry-markdown-next";

new Cherry(el, {
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
new Cherry(el, {
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
      cherry.setMarkdown(/* 按 fileId 加载 */);
      cherry.setSidebarActiveFile(fileId);
    },
  },
});
```

未提供 `fetchFiles` 时侧栏只显示大纲。

---

## 注入自定义语法

自定义 parser 走 **预览引擎**，不是顶层不存在的 `transformer` 字段：

```typescript
new Cherry(el, {
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

详见 [`extend.md`](extend.md)。

---

## AI 与上传

```typescript
new Cherry(el, {
  editor: {
    onAiRequest: async (action, text, prompts) => {
      // action: polish | proofread | translate | summarize | custom …
      return await callYourLLM(action, text, prompts);
    },
    onParseFile: async (file) => {
      const url = await upload(file);
      return { url, msg: file.name };
    },
  },
});
```

未配置 `onAiRequest` 时，AI 工具栏命令会静默失败。

---

## 实例方法

| 方法                                                                 | 说明           |
| -------------------------------------------------------------------- | -------------- |
| `getMarkdown()` / `setMarkdown(md)`                                  | 读写全文       |
| `getLayout()` / `setLayout(mode)`                                    | 布局           |
| `isSidebarVisible()` / `setSidebarVisible(show)` / `toggleSidebar()` | 侧栏           |
| `setSidebarActiveFile(id)`                                           | 高亮文件项     |
| `runCommand(name, payload?)`                                         | 执行已注册命令 |
| `destroy()`                                                          | 销毁           |

属性：`theme`（`Theme`）、`eventBus`、`storage`。

---

## 相关

- [快速开始](getting-started.md) · [主题](themes.md) · [API](api.md) · [架构](architecture.md)
