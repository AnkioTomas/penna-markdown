---
title: 快速开始
subtitle: 安装 · 三入口 · 最小示例
version: 0.1.0
repo: https://github.com/AnkioTomas/penna-markdown
tags: [guide, getting-started]
---

# [[title]]

> [[subtitle]] — 五分钟跑通编辑器或只读渲染。

版本 **[[version]]** · 仓库 [[repo]]

---

## 项目是什么

**Penna Markdown** 是浏览器端 Markdown **编辑 + 渲染** 套件，拆成三个可独立引用的包入口：

| 入口                         | 职责                                        |
| ---------------------------- | ------------------------------------------- |
| `penna-markdown`             | 完整编辑器（工具栏 / 侧栏 / 编辑区 / 预览） |
| `penna-markdown/renderer`    | Markdown → DOM（增量更新）                  |
| `penna-markdown/transformer` | Markdown → AST → HTML 字符串                |

语法：**GFM** + **Penna 扩展**（Alert、容器、卡片、公式、Mermaid/ECharts 等）。

---

## 安装

```bash
pnpm add penna-markdown
# 或 npm / yarn
```

开发本仓库：

```bash
pnpm install
pnpm demo      # 本地演示站
pnpm build     # 产出 dist/
pnpm test
```

---

## 选哪条路

::: tabs
@tab:active 完整编辑器
需要所见即所得编辑、工具栏、分栏预览 → 用 [`editor.md`](editor.md)。
@tab 只读预览
文档站 / 文章页，只要渲染 → 用 [`renderer.md`](renderer.md)。
@tab 只要 AST / HTML 字符串
服务端或自定义挂载 → 用 [`transformer.md`](transformer.md)。
:::

---

## 最小编辑器

::: steps

1. **挂载点**

```html
<div id="editor" style="height: 100vh"></div>
```

2. **样式**

```html
<link rel="stylesheet" href="penna-markdown/penna-editor-base.min.css" />
<link rel="stylesheet" href="penna-markdown/penna-render.min.css" />
<!-- 可选皮肤：penna-theme-github-editor/render.min.css 等（default 无单独主题文件） -->
```

3. **初始化**

```typescript
import { Penna } from "penna-markdown";

const penna = new Penna(document.getElementById("editor")!, {
  themeId: "default",
  layout: "split",
  editor: {
    value: "# Hello\n\n**Penna Markdown**",
  },
});
```

:::

> [!TIP]
> 本地演示：`pnpm demo`，打开「全功能编辑器」可看到 Options / AI / 语法全集。

---

## 最小只读渲染

完整组装（`Theme` + `EventBus` + `Log` + `Renderer`）见 [`renderer.md`](renderer.md)。本地可直接打开 Demo「独立渲染器」对照。

---

## 下一步

:::: card-grid cols="{ sm: 1, md: 2 }"

::: link-card 编辑器 guide link="editor.md"

`PennaOptions`、侧栏、AI、上传回调。
:::

::: link-card 语法索引 link="syntax.md"

GFM + Penna 扩展一览，链到活样例。
:::

::: link-card 主题 link="themes.md"

皮肤 CSS、明暗、白名单。
:::

::: link-card API 速查 link="api.md"

构造选项与实例方法（对齐源码）。
:::

::::
