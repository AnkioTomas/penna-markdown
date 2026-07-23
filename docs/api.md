---
title: API 速查
subtitle: 对外接口（对齐 0.1.0 源码）
version: 0.1.0
tags: [reference, api]
---

# [[title]]

> [[subtitle]] — `0.x` 可能调整；集成请锁定版本。

仓库与包名：`penna-markdown`。

---

## 包入口

| import                       | 主要符号                                                                                                                          | IIFE 全局名            |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `penna-markdown`             | `Penna`, `PennaOptions`, `EditorOptions`, `OnAiRequest`, `OnParseFile`, `DEFAULT_TOOLBAR_ITEMS`, `Theme`, `EventBus`, `Log`, `el` | `PennaNextEditor`      |
| `penna-markdown/renderer`    | `Renderer`, `RenderOption`, `Theme`, `EventBus`, `Log`                                                                            | `PennaNextRenderer`    |
| `penna-markdown/transformer` | `TransformerEngine`, `TransformerEngineOptions`, `BaseInlineParser`, …                                                            | `PennaNextTransformer` |

样式见 [`themes.md`](themes.md) 与 `package.json` `exports`。

> [!NOTE]
> 独立渲染从 `penna-markdown/renderer` 取 `Theme` + `EventBus` + `Log`，自行组装后交给 `Renderer`。编辑器内部已完成组装。

---

## Penna

```typescript
import { Penna } from "penna-markdown";

const penna = new Penna(rootEl, options?: PennaOptions);
```

### 属性

:::: field-group

::: field theme
@type Theme
只读。皮肤与事件总线入口。
:::

::: field eventBus
@type EventBus
只读。实例级总线。
:::

::: field storage
@type StorageAPI
只读。本地存储适配器。
:::

::::

### 方法

:::: field-group

::: field getMarkdown
@type () => string
当前文档全文。
:::

::: field setMarkdown
@type (markdown: string) => void
整篇替换；内容相同则 no-op。
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

### PennaOptions

完整字段说明见 [`editor.md`](editor.md)（含 `EditorOptions`、`PreviewOptions`、`ToolbarOptions`、`SideBarOptions`、`StorageAPI`、回调类型）。

自定义解析：`preview.transformerEngineOptions`（**没有**顶层 `transformer` 字段）。

---

## Renderer

构造选项见 [`renderer.md`](renderer.md)。

```typescript
import {
  Renderer,
  Theme,
  EventBus,
  Log,
  type RenderOption,
} from "penna-markdown/renderer";

const log = new Log(false);
const eventBus = new EventBus(false, "[penna]", log);
const theme = new Theme(eventBus, log, rootEl);

new Renderer({
  mount,
  theme,
  eventBus,
  logger: log,
  inlineParsers?,
  blockParsers?,
} satisfies RenderOption);
```

:::: field-group

::: field render
@type (markdown: string, changes?: PennaChangeLineSet[]) => RenderResult
增量优先；失败自动降级全量。
:::

::: field renderFull
@type (markdown: string) => RenderResult
强制全量渲染。
:::

::: field append
@type (chunk: string) => RenderResult
在文档末尾追加字符（流式场景）。
:::

::: field getToc
@type () => TocItem[]
层级目录树（无 AST 时为空数组）。
:::

::: field getTocFlat
@type () => TocFlatItem[]
扁平目录。
:::

::: field getMountedBlocks
@type () => BlockIndex[]
当前挂载块索引。
:::

::: field getStore
@type () => ParserStore | null
最近一次解析的 `ParserStore`。
:::

::: field getMount
@type () => HTMLElement
挂载点。
:::

::: field destroy
@type () => void
释放监听与 lightbox 等。
:::

::::

---

## TransformerEngine

构造选项见 [`transformer.md`](transformer.md)。

```typescript
import {
  TransformerEngine,
  type TransformerEngineOptions,
} from "penna-markdown/transformer";

new TransformerEngine({
  inlineParsers?,
  blockParsers?,
  syntaxOptions?,
  renderOptions?,
  isDark?,
} satisfies TransformerEngineOptions);
```

:::: field-group

::: field parse
@type (markdown: string) => MarkdownNode
全文解析 → 根 AST。
:::

::: field parseIncremental
@type (prevAst: MarkdownNode, markdown: string | string[], range: IncrementalParseRange) => IncrementalParseResult
增量解析（编辑器内部使用）。
:::

::: field render
@type (ast: MarkdownNode) => string
AST → HTML 字符串。
:::

::: field renderBlock
@type (node: MarkdownNode, ast: MarkdownNode) => string
单块渲染。
:::

::::

---

## Theme

详见 [`themes.md`](themes.md)。

:::: field-group

::: field list
@type () => string[]
可用皮肤 id；白名单空/省略 = 全部内置。
:::

::: field setTheme
@type (id: string) => void
切换皮肤；未知 id 跳过并打错误日志。
:::

::: field setLightDark
@type (mode: "light" | "dark") => void
切换明暗。
:::

::: field getTheme
@type () => { id: string; mode: LightDark; isDark: boolean; root: HTMLElement }
当前主题快照。
:::

::::

---

## 回调类型

定义在 `EditorOptions`，由 `penna-markdown` 入口 re-export。完整说明亦见 [`editor.md`](editor.md)。

:::: field-group

::: field OnParseFile
@type (file: File) => Promise<{ url: string; msg: string }>
`editor.onParseFile`：粘贴/拖入文件上传。
:::

::: field OnAiRequest
@type (action: string, text: string, prompts?: string, onUpdate?: (contentDelta?: string, thinkingDelta?: string) => void, signal?: AbortSignal) => Promise<string>
`editor.onAiRequest`：AI 生成；`onUpdate` 传增量 delta；`signal` 在用户取消时 abort。
:::

::::

---

## 相关

- [编辑器](editor.md) · [渲染器](renderer.md) · [转换器](transformer.md) · [扩展语法](extend.md)
