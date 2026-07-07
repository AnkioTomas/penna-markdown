---
title: Editor 编辑器子系统
parent: Cherry Markdown Next 设计文档
---

# [[title]]

[← 返回索引](./index.md)

---

## Cherry：编排者，不是上帝对象

`Cherry` 类的职责被刻意限制为：

1. **DOM 骨架搭建** — 创建 `.cherry-*` 容器树
2. **子模块实例化** — 传入各 mount 点与 `Theme`
3. **对外 facade** — `getMarkdown` / `setMarkdown` / `runCommand` / `destroy`
4. **少量布局状态** — sidebar 显隐、layout mode 转发

子模块之间 **不通过 Cherry 互相调用**，而通过 `Theme` 事件协作（见 [`theme-and-events.md`](./theme-and-events.md)）。

---

## Editor：CodeMirror 6 防腐层

路径：`src/editor/editor/Editor.ts`

### 为什么包这一层？

| 原因     | 说明                                                                   |
| -------- | ---------------------------------------------------------------------- |
| 隔离依赖 | 除 `editor/editor/` 与 lezer 扩展外，项目不直接 import `@codemirror/*` |
| 事件翻译 | CM `updateListener` → `theme.emit("editor:change", { markdown, tr })`  |
| 扩展集中 | Cherry 数学块、行内扩展、code info 插件在此注册                        |

### 默认 CM 扩展

- `history` + markdown keymap + defaultKeymap + `indentWithTab`
- `markdown()` + `CherryMathBlockExtension` + `CherryInlinesExtension`
- `createEditorSyntaxHighlighting()` — 与 Transformer 标签对齐的语法高亮
- `codeInfoPlugin` — 围栏代码块 info string 高亮
- 可选 `lineNumbers`、当前行高亮、`drawSelection`

---

## Preview：debounce + 增量渲染

路径：`src/editor/preview/Preview.ts`

| 参数     | 默认 | 说明                          |
| -------- | ---- | ----------------------------- |
| debounce | 50ms | 合并快速输入，减少 parse 次数 |

订阅事件：

- `editor:change` — 主渲染触发
- `theme:ld` / `theme:skin` — 用 `lastMarkdown` 重渲染
- `preview:force-refresh` — StatusBar 手动刷新；保留 scrollTop 避免 ScrollSync 误判

变更集传递：累积 CM `Transaction` → 转为 `CherryChangeLineSet[]` → `renderer.render(markdown, changes)`。

---

## Divider：布局与分栏

`EditorLayoutMode`：`split` | `edit` | `preview`

- 发射 `editor:layout`（内部）与响应 `cherry:layout`（工具栏/状态栏）
- `split` 模式下拖拽调整编辑/预览宽度，发射 `editor:split { split }`

---

## SideBar：大纲与文件切换

- 订阅 `preview:rendered`，从 `ast` 提取 TOC 渲染
- 点击条目 → `sidebar:toc-click { id }` → ScrollSync 滚动预览
- `setSidebarActiveFile` 供多文件 demo 切换（非核心 API）

传 `sidebar: false` 隐藏侧边栏；移动端通过 mask 点击关闭。

---

## ScrollSync：双向滚动

依赖 `preview:rendered` 提供的 `blocks`：

```text
editor scrollTop → 二分 blocks → preview scrollTop
preview scrollTop → 反查 blocks → editor scrollTop
```

使用 `isSyncingLeft` / `isSyncingRight` 防止反馈环。

---

## StatusBar

- 字数/行数统计（订阅 `editor:change`）
- 布局切换、sidebar 开关、强制刷新预览
- 发射 `cherry:layout` / `cherry:sidebar` / `preview:force-refresh`

`statusbar: false` 时不实例化。

---

## CherryOptions 速查

:::: field-group
::: field layout
@type EditorLayoutMode
@default split
初始布局模式。
:::

::: field appearance
@type light | dark
@default light
明暗模式。
:::

::: field themeId
@type string
@default default
皮肤 id，见 ThemeRegister。
:::

::: field toolbar
@type ToolbarOptions | false
@default 默认工具栏
`false` 禁用工具栏。
:::

::: field sidebar
@type SideBarOptions | boolean | false
@default true
`false` 隐藏侧边栏。
:::

::: field transformer
@type TransformerEngineOptions
@optional
解析选项；会合并到 Editor 的 transformerEngineOptions。
:::
::::

---

## 生命周期

```typescript
const cherry = new Cherry(el, options);

// editor:ready 在 microtask 中发射
cherry.on?.cherry // 通过 cherry.theme.on 订阅
  .setMarkdown("# hello");
const md = cherry.getMarkdown();
cherry.runCommand("bold");
cherry.destroy(); // 逆序 destroy 子模块，移除 DOM，发射 editor:destroy
```

> [!NOTE]
> 对外推荐通过 `cherry.theme.on("editor:ready", ...)` 等待初始化完成，而非假设 constructor 同步可用。

---

[← Renderer](./renderer.md) · [索引](./index.md) · [主题与事件 →](./theme-and-events.md)
