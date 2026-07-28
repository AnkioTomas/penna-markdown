---
title: Penna 语法速览
subtitle: 完整演示 · 精简篇幅
author:
  name: Demo
  url: https://github.com
version: 0.1.0
tags: [demo, simple, gfm, penna]
repo: https://github.com/AnkioTomas/penna-markdown
---

# [[title]]

> **[[subtitle]]** — 每种语法各一条样例；边界/压力/回归见 `docs/test.md`。

作者 [[author.name]]（[[author.url]]）· v[[version]] · 标签 [[tags]] · 仓库 [[repo]]

## 语法清单

| 类别           | 覆盖                                                                                                |
| -------------- | --------------------------------------------------------------------------------------------------- |
| **GFM**        | ATX/Setext 标题、强调、链接/图片、列表、引用、表格、分隔线、围栏/缩进代码、基础任务                 |
| **Penna 行内** | Frontmatter 变量 `[[key]]`、高亮、Emoji、HTML 属性、剧透、数学、徽章、上下标、注释、脚注引用        |
| **Penna 块级** | YAML Frontmatter、Alert×5、扩展任务列表、块级公式、脚注定义、媒体/iframe、增强代码、Mermaid/ECharts |
| **布局**       | 容器（note/tip/warning/对齐/嵌套）、Tabs、Steps、Timeline、Collapse、Cols 并排分栏                  |
| **卡片/文档**  | card / link-card / image-card / repo-card / card-grid / card-masonry / field / field-group          |

---

## Frontmatter 与变量

文首 `---` 围栏解析为 YAML；正文用 `[[key]]` 引用（嵌套键用 `.` 分隔）。

未定义变量保留字面量：[[undefined.key]] · 行内 code 内不替换：`[[version]]`

---

## GFM 标准语法

### 标题

# 一级 ATX {#atx-h1}

## 二级 ATX {#atx-h2}

### 三级 ATX

Setext 二级
------------

Setext 一级
===========

### 强调与删除

_斜体_ **粗体** _**粗斜体**_ ~~删除线~~ · 嵌套 **粗 _斜_ 粗**

~~删除线~~ 用双波浪线（单波浪线是下标，见「上下标」）· 转义 \*literal\*

行末硬换行：第一行\
仍属同段

### 链接与图片

[内联链接](https://example.com) · [带标题](https://example.com "hover title")

<https://example.com/autolink> · 引用式 [ref][demo-ref]

[demo-ref]: https://example.com/ref "引用定义"

![行内图](https://api.ankio.net/picsum/120/60) · 引用式 ![ref图][img-ref]

[img-ref]: https://api.ankio.net/picsum/120/60

### 列表

- 无序 A
  - 嵌套 A.1
- 无序 B

1. 有序一
2. 有序二
   1. 嵌套 2.1

- 松散项

  项下段落（仍属上一项）

- [ ] GFM 基础待办
- [x] GFM 基础完成

### 引用

> 单行引用
>
> > 嵌套引用
>
> 引用内列表：
>
> - 要点
> - `code`

### 表格与分隔线

| 左     |    中    |      右 |
| :----- | :------: | ------: |
| A      |    B     |       C |
| `code` | **bold** | :smile: |

---

---

### 代码

行内 `` `const x = 1` ``

```js
// 围栏代码
export const sum = (a, b) => a + b;
```

    // 缩进代码块（4 空格）
    function hello() {
      return 'world';
    }

---

## Penna 行内扩展

### 高亮

==默认== ==重要=={.important} ==注意=={.note} ==提示=={.tip} ==警告=={.warning} ==谨慎=={.caution} ==危险=={.danger}

### Emoji

短码用 GitHub 英文名，未命中原样输出（如 `:赞:` → :赞:）。

:smile: :rocket: :heart: :warning: :bulb: :+1: :100:

### HTML 属性

**加粗**{.highlight} · **加粗**{#special} · **加粗**{#id .class} · **加粗**{class="x" data-a="1"}

[链接](https://example.com){.button target="_blank"} · ![pic](https://api.ankio.net/picsum/80/80){.rounded}

### 剧透 · 数学 · 徽章 · 上下标

!! 悬浮剧透 !! · !! 点击 !! {click} · !! 另一种写法 !! {.click}

Euler $e^{i\pi}+1=0$ · $\mathbb{R}^2$ · 同行块级 $$E=mc^2$$

$$
\begin{bmatrix} 1 & 0 \\ 0 & 1 \end{bmatrix}
$$

[New]{.tip .top} [note]{.note} [important]{.important} [warning]{.warning} [caution]{.caution} [danger]{.danger .bottom}

下标 H~2~O · 上标 E=mc^2^ · x^_n_^ · 双波浪线是删除线 ~~del~~

### 注释 · 脚注引用

可见 %% 编辑备注（读者不可见） %% 继续。空注释：前%%%%后 → `前后`

块级注释：
%%%
多行备注
不渲染
%%%

正文引用[^note]与[^ref-link]。

---

## Penna 块级扩展

### Alert（GFM Admonition）

> [!NOTE]
> 应当了解的信息。

> [!TIP]
> 有用建议。

> [!IMPORTANT]
> 关键信息。

> [!WARNING]
> 需要立即注意。

> [!CAUTION]
> 可能有负面后果。

### 扩展任务列表

- [ ] 待办
- [x] 完成
- [/] 进行中
- [>] 延期
- [<] 提前
- [-] 取消
- [!] 紧急

### 块级公式

$$
\frac{\partial f}{\partial x} = \lim_{h \to 0} \frac{f(x+h)-f(x)}{h}
$$

### 自定义容器

::: note 📘 说明
默认 note 容器。
:::

::: tip 💡 提示
容器内支持 **Markdown**、列表与嵌套 `code`。
:::

::: important ⭐ 重要
关键信息。
:::

::: warning ⚠️ 警告
与 Alert 共用主题色体系。
:::

::: caution 🛑 谨慎
可能有负面后果。
:::

::: danger 🚨 危险
删除前请备份。
:::

::: center
居中文本（别名 `::: c`）
:::

::: right
右对齐（别名 `::: r`）
:::

::: tip 外层
外层正文。

::: info 内层
嵌套容器示例。
:::

:::

### 折叠面板

::: collapse

- 默认折叠

  普通折叠面板。
  :::

::: collapse expand

- 默认展开

  expand 模式。
  :::

::: collapse accordion

- 面板 A

  内容 A

- :+ 面板 B

  强制展开（`:+`）

- :- 面板 C

  accordion 下强制折叠（`:-`）
  :::

### Tabs · Steps · Timeline

::: tabs
@tab 标签 A
Tab A 内容
@tab:active 标签 B
Tab B（默认激活）
:::

::: steps

1. 安装

```bash
pnpm install
```

2. 编写 Markdown
3. 预览渲染

:::

标题必填；空行之后才是节点正文，紧跟的续行仍算标题（渲染成 `<br>`）。

::: timeline

- [2024-01-01] 阶段一

  项目启动，完成基础架构设计。

- [2024-06-15:success] 阶段二
  续行仍属标题

  核心模块开发完成，进入测试阶段。

- [2024-12-31:important] 阶段三

:::

::: timeline line="dotted" placement="between"

- [2025-01:important] 第一项在左

  `placement="between"` 时节点左右交替，另可选 `left` / `right`。

- [2025-06:success] 第二项在右

  `line` 可选 `solid` / `dashed` / `dotted`。

:::

### 列布局

::: cols gap=24px
@col max-width=200px
固定最大 200px 的侧栏。列内 `---` 仍是普通 hr。
@col
主内容区自动均分剩余空间，可再嵌套：

::: cols
@col
内左
@col
内右
:::
:::

---

## 代码与图表

### 增强代码块

```json title="package.json"
{ "name": "penna-markdown", "version": "0.1.0" }
```

```bash title='run.sh'
echo "单引号 title"
```

```js{2,4}
export default {
  name: "demo",      // 高亮
  data: () => ({}),
  mounted() {},      // 高亮
};
```

```json title="package.json" {2-3}
{
  "name": "demo",
  "private": true
}
```

默认折叠超过 10 行的部分：

```css :collapsed-lines
html {
  margin: 0;
}
body {
  color: inherit;
}
```

单起一行的 `...` 手动指定折叠位置（该行渲染为空行）：

```css :collapsed-lines
:root {
  --a: 1;
}
... .rest {
  display: none;
}
```

```css :collapsed-lines=5
.line {
  color: red;
}
.line {
  color: orange;
}
.line {
  color: yellow;
}
.line {
  color: green;
}
.line {
  color: blue;
}
.line {
  color: indigo;
}
```

### Mermaid

`mermaid` / `graph` / `echarts` 围栏支持 `max-width`（纯数字默认 px，也可写 `640px` / `80%`）。

```mermaid max-width=640
flowchart LR
  MD[Markdown] --> AST[AST] --> HTML[HTML]
```

```mermaid
sequenceDiagram
  participant U as 用户
  participant E as Engine
  U->>E: parse(md)
  E-->>U: AST
```

```mermaid
pie title 占比
  "GFM" : 45
  "Penna" : 35
  "Custom" : 20
```

```graph
flowchart TD
  输入 --> 解析 --> 渲染
```

### ECharts

```echarts max-width=80%
{
  "title": { "text": "柱状图" },
  "xAxis": { "type": "category", "data": ["A", "B", "C"] },
  "yAxis": { "type": "value" },
  "series": [{ "type": "bar", "data": [12, 20, 15] }]
}
```

```echarts
{
  "title": { "text": "折线图", "left": "center" },
  "xAxis": { "type": "category", "data": ["Q1", "Q2", "Q3"] },
  "yAxis": { "type": "value" },
  "series": [{ "type": "line", "smooth": true, "data": [12, 18, 9] }]
}
```

```echarts
{
  "title": { "text": "饼图", "left": "center" },
  "series": [{ "type": "pie", "radius": "55%", "data": [{ "value": 40, "name": "A" }, { "value": 32, "name": "B" }] }]
}
```

---

## 媒体嵌入

> [api.ankio.net](https://api.ankio.net/?help=1) · 任意接口加 `?help=1` 查看帮助

!iframe[API 帮助总览](https://api.ankio.net/?help=1)

!video[随机视频 /video](https://api.ankio.net/video)

!audio[随机音乐 /music](https://api.ankio.net/music)

!video[带封面](https://api.ankio.net/video){poster=https://api.ankio.net/picsum/640/360}

!audio[带封面](https://api.ankio.net/music){poster=https://api.ankio.net/picsum/320/180}

---

## 卡片体系

::: card 基础卡片

普通卡片，支持 **Markdown** 正文。

:::

::: link-card 文档 link="https://api.ankio.net/?help=1" icon="https://api.ankio.net/favicon?url=https://github.com"

整卡可点击跳转；`image=` 可作 `icon=` 别名。
:::

::: link-card https://github.com

仅 URL 简写。
:::

::: image-card image="https://api.ankio.net/picsum/640/360" title="随机图片" href="https://api.ankio.net/picsum?help=1" author="Demo" date="2025/01/01"

[`/picsum/640/360`](https://api.ankio.net/picsum?help=1) 图片卡片。
:::

::: repo-card vuepress/core
VuePress 2 核心库
:::

::: repo-card tencent/penna-markdown visibility="Public"
带 `visibility` 属性的仓库卡。
:::

:::: card-grid cols="{ sm: 1, md: 2 }"

::: link-card 指南 link="https://api.ankio.net/?help=1"

网格中的链接卡。
:::

::: card 说明

网格中的普通卡。
:::

::::

:::: card-masonry cols="3" gap="12"

![图1](https://api.ankio.net/picsum/320/240)

![图2](https://api.ankio.net/picsum/280/360)

![图3](https://api.ankio.net/picsum/300/200)

::::

---

## 字段文档

::: field theme
@type ThemeConfig
@required
@default { base: '/' }
单个字段块。
:::

:::: field-group
::: field theme
@type ThemeConfig
@required
@default { base: '/' }
主题配置对象
:::

::: field enabled
@type boolean
@optional
@default true
是否启用功能
:::
::::

---

## 脚注

人生自古谁无死[^note]，留取丹心照汗青。

详见 [文档](https://example.com)[^ref-link]。

[^note]: 出自 **《过零丁洋》** · 支持 _富文本_ 脚注正文。

[^ref-link]: 脚注定义可含 [链接](https://example.com) 与 `code`。

---

_文档路径：`docs/simple.md` · 完整文档见 [文档中心](_index.md) · 回归见 [test.md](test.md)_
