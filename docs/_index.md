---
title: 文档中心
subtitle: Penna Markdown
version: 0.1.0
repo: https://github.com/AnkioTomas/penna-markdown
tags: [docs, index]
---

# [[title]]

> **[[subtitle]]** — 浏览器端 Markdown 编辑与渲染套件文档。

版本 **[[version]]** · 仓库 [[repo]]

---

## 从这里开始

::: steps

1. [快速开始](getting-started.md) — 安装与三入口
2. [编辑器](editor.md) / [渲染器](renderer.md) / [转换器](transformer.md) — 按场景选用
3. [语法索引](syntax.md) → [simple.md](simple.md) — 用活文档对照渲染效果

:::

---

## 导航

:::: card-grid cols="{ sm: 1, md: 2 }"

::: link-card 快速开始 link="getting-started.md"

安装、最小示例、选哪条包入口。
:::

::: link-card 编辑器 link="editor.md"

`Penna` 用法、Options、AI / 上传 / 侧栏。
:::

::: link-card 渲染器 link="renderer.md"

独立 `Renderer`、增量 DOM、TOC。
:::

::: link-card 转换器 link="transformer.md"

`TransformerEngine`：AST 与 HTML 字符串。
:::

::: link-card 主题 link="themes.md"

皮肤 CSS、明暗、白名单。
:::

::: link-card 品牌视觉 link="brand.md"

Logo 色板、default 主题造型语言。
:::

::: link-card 扩展语法 link="extend.md"

自定义 Parser 注册与注入。
:::

::: link-card API 速查 link="api.md"

对外接口，对齐源码。
:::

::: link-card 架构概览 link="architecture.md"

三层拆分与数据流（维护者）。
:::

::::

---

## 样例与回归

| 文档                            | 用途                     |
| ------------------------------- | ------------------------ |
| [语法速览 simple.md](simple.md) | 每种语法一条精简样例     |
| [完整测试 test.md](test.md)     | 边界 / 压力 / 回归活文档 |

本地：`pnpm demo` →「文档预览」或「全功能编辑器」。

---

## 站点约定

| 文件          | 作用                               |
| ------------- | ---------------------------------- |
| `_sidebar.md` | 侧栏：`## 分组` + `- [标题](路径)` |
| `_index.md`   | 目录入口（本页）                   |

正文中的相对 `.md` 链接可在预览内跳转加载。
