---
title: API 速查
subtitle: 对外接口（对齐 0.1.0 源码）
version: 0.1.0
tags: [reference, api]
---

# [[title]]

> [[subtitle]] — `0.x` 可能调整；集成请锁定版本。

仓库与包名：`cherry-markdown-next`。

---

## 包入口

| import                             | 主要符号            | IIFE 全局名             |
| ---------------------------------- | ------------------- | ----------------------- |
| `cherry-markdown-next`             | `Cherry`, `el`      | `CherryNextEditor`      |
| `cherry-markdown-next/renderer`    | `Renderer`          | `CherryNextRenderer`    |
| `cherry-markdown-next/transformer` | `TransformerEngine` | `CherryNextTransformer` |

样式见 [`themes.md`](themes.md) 与 `package.json` `exports`。

> [!NOTE]
> 独立渲染还需自行组装 `Theme` + `EventBus` + `Log`（见 demo `modules/renderer`）。编辑器内部已完成组装。

---

## Cherry

```typescript
import { Cherry } from "cherry-markdown-next";

const cherry = new Cherry(rootEl, options?: CherryOptions);
```

### 属性

:::: field-group
::: field theme
@type Theme
@readonly
皮肤与事件总线入口。
:::

::: field eventBus
@type EventBus
@readonly
实例级总线。
:::

::: field storage
@type StorageAPI
@readonly
本地存储适配器。
:::
::::

### 方法

:::: field-group
::: field getMarkdown()
@returns string
当前文档全文。
:::

::: field setMarkdown(markdown)
@param markdown string
整篇替换；内容相同则 no-op。
:::

::: field getLayout()
@returns `"split" | "edit" | "preview"`
当前布局。
:::

::: field setLayout(mode)
@param mode EditorLayoutMode
切换布局。
:::

::: field isSidebarVisible()
@returns boolean
侧栏是否可见。
:::

::: field setSidebarVisible(show)
@param show boolean
显隐侧栏。
:::

::: field toggleSidebar()
切换侧栏。
:::

::: field setSidebarActiveFile(fileId)
@param fileId string
高亮侧栏文件项。
:::

::: field runCommand(command, payload?)
@param command string
@param payload unknown
@returns boolean | Promise\<boolean\>
执行已注册命令。
:::

::: field destroy()
销毁实例。
:::
::::

### CherryOptions

见 [`editor.md`](editor.md)。关键字段：`layout`、`appearance`、`themeId`、`themes`、`debug`、`toolbar`、`sidebar`、`statusbar`、`storage`、`onAiRequest`、`onParseFile`、`editor`、`preview`。

自定义解析：`preview.transformerEngineOptions`（**没有**顶层 `transformer` 字段）。

---

## Renderer

```typescript
new Renderer({
  mount,
  theme,
  eventBus,
  logger,
  inlineParsers?,
  blockParsers?,
});
```

| 方法                        | 说明        |
| --------------------------- | ----------- |
| `render(md, changes?)`      | 增量优先    |
| `renderFull(md)`            | 全量        |
| `getToc()` / `getTocFlat()` | 目录        |
| `getMountedBlocks()`        | 块索引      |
| `getStore()`                | ParserStore |
| `getMount()`                | 挂载点      |
| `destroy()`                 | 销毁        |

---

## TransformerEngine

```typescript
new TransformerEngine({
  inlineParsers?,
  blockParsers?,
  syntaxOptions?,
  renderOptions?,
  isDark?,
});
```

| 方法                     | 说明          |
| ------------------------ | ------------- |
| `parse(md)`              | → AST         |
| `parseIncremental(…)`    | 增量 parse    |
| `render(ast)`            | → HTML 字符串 |
| `renderBlock(node, ast)` | 单块          |

---

## Theme

| 方法                 | 说明                           |
| -------------------- | ------------------------------ |
| `list()`             | 可用皮肤；白名单空/省略 = 全部 |
| `setTheme(id)`       | 未知 id 跳过并打错误日志       |
| `setLightDark(mode)` | `light` \| `dark`              |
| `getTheme()`         | `{ id, mode, isDark, root }`   |

---

## 回调类型

```typescript
type OnParseFile = (file: File) => Promise<{ url: string; msg: string }>;

type OnAiRequest = (
  action: string,
  text: string,
  prompts?: string,
) => Promise<string>;
```

---

## 相关

- [编辑器](editor.md) · [渲染器](renderer.md) · [转换器](transformer.md) · [扩展语法](extend.md)
