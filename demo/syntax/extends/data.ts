export interface SyntaxDemoItem {
  id: string;
  name: string;
  markdown: string;
}

export const EXTENDS_DATA: SyntaxDemoItem[] = [
  {
    id: "frontmatter",
    name: "Frontmatter 与变量",
    markdown: `---
title: Penna Markdown
author:
  name: Demo User
version: 1.0.0
tags:
  - markdown
  - demo
repo: https://github.com/Tencent/penna-markdown
---

### YAML Frontmatter

文档顶部的 \`---\` 围栏会被解析为 Frontmatter，写入解析上下文。

### 变量引用 [[name]]

文档标题：[[title]]

作者：[[author.name]]

版本：[[version]]

标签：[[tags]]

仓库：[[repo]]

### 未定义变量

未定义的变量会保留字面量：[[undefined.key]]

行内 code 内**不**替换：\`[[version]]\` 保持原样。`,
  },
  {
    id: "html-attrs",
    name: "内联属性 (HTML Attrs)",
    markdown: `### 简化语法：类名与 ID

[这段文字会被赋予 text-red 类名]{.text-red}

[这段文字同时包含多个类名]{.text-blue .font-bold}

[带有 ID 的文字]{#my-id}

[同时包含 ID 和 class]{#target-text .bg-gray .text-white}

### 标准 HTML 属性语法

**加粗**{class="highlight" data-a="1" id="x"}

**加粗**{.a .b .c}

### 注入到链接与图片

[点我](https://example.com){.button target="_blank"}

![pic](https://picsum.photos/80/80){.rounded}`,
  },
  {
    id: "highlight",
    name: "文字高亮 (Highlight)",
    markdown: `### 默认高亮

阅读时需要关注 ==极其关键的字眼==，渲染为 <mark> 元素。

### 语义变体（配合 html_attrs）

==默认高亮== ==重要=={.important} ==注意=={.note} ==提示=={.tip} ==警告=={.warning} ==谨慎=={.caution} ==危险=={.danger}

### 嵌套行内格式

==**加粗高亮**==、==*斜体*==、==\`code\`==、==[链接](https://example.com)==

### 连续高亮

测试 ==第一处高亮== 和 ==第二处高亮== 的连续渲染。`,
  },
  {
    id: "badge",
    name: "徽章 (Badge)",
    markdown: `### 语义变体

[note]{.note} [tip]{.tip} [important]{.important} [warning]{.warning} [caution]{.caution} [danger]{.danger}

### 垂直位置

[置顶]{.tip .top} [默认中间]{.tip} [置底]{.warning .bottom}

### 与正文结合

今天我们发布了 [v2.5.0]{.tip} 版本，修复了一个 [严重内存泄露]{.danger} 的 Bug。

### 非徽章方括号

裸方括号 \`[进行中]\` **不会**变徽章（让位 GFM 链接/引用语法）。`,
  },
  {
    id: "emoji",
    name: "表情符号 (Emoji)",
    markdown: `### 常用 Emoji

:smile: :thumbsup: :+1: :-1: :heart: :rocket: :tada: :fire: :sparkles: :check: :warning: :bulb: :star:

### 中文短码

:赞: :微笑: :哭: :思考:

### 连续匹配

:smile::heart:（无空格时按规则逐段匹配）

### 未知短码

\`:not_a_real_emoji:\` 保持原样`,
  },
  {
    id: "spoiler",
    name: "剧透模糊 (Spoiler)",
    markdown: `### 悬浮显示（默认）

这部电影的结局非常令人震惊，因为 !!主角其实在一开始就已经死了!!。

### 点击显示

!!点击揭晓答案!! {click}

!!另一种写法!! {.click}

### 多个剧透

支持多个 !!隐藏要素一!! 和 !!隐藏要素二!!。

### 嵌套格式

!! **加粗剧透** 与 ==高亮== !!`,
  },
  {
    id: "supsub",
    name: "上标与下标 (Sup/Sub)",
    markdown: `### 下标 (Subscript)

化学式：H~2~O，二氧化碳 CO~2~，硫酸 H~2~SO~4~。

### 上标 (Superscript)

数学指数：2^10^ 等于 1024，3^3^ 等于 27。

面积单位：m^2^，体积 m^3^。

### 嵌套

x^*important*^、a~\`code\`~

### 与删除线共存

~~删除~~ 不影响 H~2~O`,
  },
  {
    id: "comment",
    name: "注释 (Comment)",
    markdown: `### 行内注释

可见文本 %% 这一段是写给自己的悄悄话，预览/导出时完全不可见 %% 继续书写。

### 块级注释

以下部分在渲染时完全隐藏：

%%%
**未完待续**
这块内容暂时不发布。
%%%

### 空注释

前%%%%后 → 渲染为「前后」

### 注释与强调

**可见** %% 隐藏备注 %% *继续*`,
  },
  {
    id: "math",
    name: "数学公式 (Math)",
    markdown: `### 行内公式

爱因斯坦质能方程 $E = mc^2$，欧拉公式 $e^{i\\pi} + 1 = 0$。

分数 $\\frac{a}{b}$、求和 $\\sum_{i=1}^{n} i$

### 块级公式（分行）

$$
x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}
$$

### 块级公式（同行）

$$E=mc^2$$

### 矩阵

$$
\\begin{bmatrix}
1 & 0 & 0 \\\\
0 & 1 & 0 \\\\
0 & 0 & 1
\\end{bmatrix}
$$`,
  },
  {
    id: "footnote",
    name: "脚注 (Footnote)",
    markdown: `### 单个脚注

这是一个需要引用的专业术语[^1]。

### 多个脚注

Penna Markdown[^penna] 支持 GFM 风格脚注[^gfm]。

### 重复引用

第一次提到 VuePress[^vp]，后文再次引用 VuePress[^vp]，编号相同。

### 富文本脚注

详见 [官方文档](https://example.com)[^doc]。

[^1]: 术语解释：关于该术语的详细说明。
[^penna]: Penna Markdown 扩展语法演示项目。
[^gfm]: GitHub Flavored Markdown 规范中的脚注扩展。
[^vp]: VuePress 是 Vue 驱动的静态站点生成器。
[^doc]: 支持 **加粗**、*斜体*、[链接](https://example.com) 等 Markdown。`,
  },
  {
    id: "alert",
    name: "GFM Alert 警报",
    markdown: `### 五种警报类型

> [!NOTE]
> 读者应当了解的信息，即使快速浏览也应看到。

> [!TIP]
> 有用建议，帮助更好地完成任务。

> [!IMPORTANT]
> 关键信息，达成目标必须知道。

> [!WARNING]
> 需要立即注意，避免问题。

> [!CAUTION]
> 风险提示，某些行为可能有负面后果。

### 多段 Alert

> [!TIP]
> 第一段
>
> 第二段，空行分隔。

> Alert 使用 \`>\` 引用语法；容器使用 \`:::\` 围栏语法。`,
  },
  {
    id: "container",
    name: "自定义容器 (Container)",
    markdown: `### 语义容器

::: note 📘 说明
默认 note 容器，支持 **Markdown**、列表、代码。
:::

::: tip 💡 提示
有用建议。
:::

::: important ⭐ 重要
关键信息。
:::

::: warning ⚠️ 警告
操作前请确认。
:::

::: caution 🛑 谨慎
可能有负面后果。
:::

::: danger 🚨 危险
删除数据库前请务必备份！
:::

::: info ℹ️ 信息
补充说明。
:::

### 类型缩写

::: n 缩写 note
:::

::: t 缩写 tip
:::

::: im 缩写 important
:::

::: w 缩写 warning
:::

::: d 缩写 danger
:::

::: i 缩写 info
:::

### 对齐容器

::: left
左对齐文本。别名 \`::: l\`
:::

::: center 居中标题
居中文本。别名 \`::: c\`
:::

::: right
右对齐文本。别名 \`::: r\`
:::

::: justify
两端对齐的长文本段落。别名 \`::: j\`
:::

### 嵌套容器

::: tip 外层提示
外层正文。

::: info 内层信息
内层 **嵌套** 正文。
:::

::: warning 同级内层
与 info 同级。
:::
:::`,
  },
  {
    id: "collapse",
    name: "折叠面板 (Collapse)",
    markdown: `### 默认折叠

::: collapse
- 什么是 AST？

  抽象语法树——Markdown 的结构化中间表示。

- 如何调试？

  打开 AST 调试台，左侧编辑右侧看树。
:::

### 默认全部展开 expand

::: collapse expand
- 展开项 1

  内容 1

- 展开项 2

  内容 2
:::

### 手风琴 accordion

::: collapse accordion
- 手风琴 A

  同时只展开一个。

- 手风琴 B

  内容 B

- 手风琴 C

  内容 C
:::

### :+ / :- 标记

::: collapse
- 默认折叠

  正文

- :+ 强制展开

  即使默认折叠也展开。
:::

::: collapse expand
- 默认展开

  正文

- :- 强制折叠

  expand 模式下仍折叠。
:::

### 多行标题

::: collapse
- 主标题
  副标题（同属 summary）

  正文内容
:::`,
  },
  {
    id: "task-list",
    name: "增强任务列表 (Task List)",
    markdown: `### 全部任务状态

- [ ] 待办 (todo)
- [x] 已完成 (done)
- [/] 进行中 (in_progress)
- [>] 延期 / 迁移 (migrated)
- [<] 提前排期 (scheduled)
- [-] 已取消 (cancelled)
- [!] 紧急 / 高优先级 (urgent)

### 嵌套任务

- [x] 父任务完成
  - [ ] 子任务 A
  - [/] 子任务 B 进行中
- [ ] 父任务待办

### 与普通列表共存

- plain unordered
- [ ] task item`,
  },
  {
    id: "tabs",
    name: "选项卡 (Tabs)",
    markdown: `### 基础选项卡

::: tabs
@tab 概述
Penna Markdown 基于 **AST** 解析。

@tab:active API
\`\`\`ts
import { TransformerEngine } from "penna-markdown/transformer";
const engine = new TransformerEngine();
engine.render(engine.parse(markdown));
\`\`\`

@tab 嵌套容器
::: danger 注意
Tab 面板内可嵌套任意块级语法。
:::

@tab 表格
| A | B |
| --- | --- |
| 1 | 2 |
:::

### 多组 Tabs

::: tabs
@tab 第二组 · X
第二组内容 X
@tab 第二组 · Y
第二组内容 Y
:::`,
  },
  {
    id: "steps",
    name: "步骤条 (Steps)",
    markdown: `::: steps

1. 克隆仓库

\`\`\`bash
git clone https://github.com/Tencent/penna-markdown
cd penna-markdown
\`\`\`

2. 安装依赖

\`\`\`bash
pnpm install
\`\`\`

3. 启动 Demo

\`\`\`bash
pnpm dev
\`\`\`

4. 编写 Markdown

::: tip 提示
在 demo 中修改 Markdown 并观察实时渲染。
:::

5. 完成 🎉

:::`,
  },
  {
    id: "timeline",
    name: "时间轴 (Timeline)",
    markdown: `### 节点类型

::: timeline
- 成功节点
  time=2025-03-20 type=success

  成功类型，线条与圆点同色。

- 警告节点
  time=2025-04-20 type=warning

  警告类型。

- 危险节点
  time=2025-05-01 type=danger

  危险类型。

- 重要节点
  time=2025-06-01 type=important

  重要类型。

- 提示节点
  time=2025-07-01 type=tip

  提示类型。
:::

### 线条风格

::: timeline line="dotted"
- 继承 dotted
  time=2025-03-20

  容器级 line=dotted

- 覆盖 dashed
  time=2025-04-20 line=dashed

  单项 line=dashed
:::

### 布局 placement

::: timeline placement="right"
- 右侧节点
  time=2025-03-20 type=success

  内容在时间轴右侧。
:::

::: timeline placement="between"
- 右侧
  time=2025-03-20 placement=right type=success

  placement=right

- 左侧
  time=2025-04-20 type=warning

  默认左侧
:::

### 自定义颜色

::: timeline
- 自定义
  time=2025-03-20 color=#6366f1

  \`color=#6366f1\` 覆盖线条与圆点。
:::`,
  },
  {
    id: "enhanced-code",
    name: "增强代码块 (Enhanced Code)",
    markdown: `### 带标题

\`\`\`json title="package.json"
{
  "name": "penna-markdown",
  "version": "0.1.0",
  "type": "module"
}
\`\`\`

### 单引号 / 无引号 title

\`\`\`bash title='run.sh'
#!/bin/sh
echo "hello"
\`\`\`

\`\`\`makefile title=Makefile
all:
\t@echo ok
\`\`\`

### 行高亮 lang{lines}

\`\`\`js{1,4,6-8}
export default { // line 1
  data () {
    return {
      msg: 'Highlighted!', // line 4
      lorem: 'ipsum',
      extra: true // lines 6-8
    }
  }
}
\`\`\`

### 行高亮 title 后的 {lines}

\`\`\`json title="package.json" {2-3}
{
  "name": "demo",
  "private": true
}
\`\`\`

### 折叠代码 ... 标记

\`\`\`css :collapsed-lines
html {
  margin: 0;
  background: #111;
}

... more code
body {
  color: #eee;
}
\`\`\`

### 折叠 + 最大可见行数

\`\`\`css :collapsed-lines=5
.line { color: red; }
.line { color: orange; }
.line { color: yellow; }
.line { color: green; }
.line { color: blue; }
.line { color: indigo; }
.line { color: violet; }
.line { color: pink; }
\`\`\`

### 普通语言（无增强 meta）

\`\`\`typescript
const engine = new TransformerEngine();
type Node = ReturnType<typeof engine.parse>;
\`\`\``,
  },
  {
    id: "special-code",
    name: "图表代码块 (Mermaid / ECharts)",
    markdown: `### Mermaid 流程图

\`\`\`mermaid
flowchart TD
    A[Markdown 输入] --> B{块级解析}
    B --> C[行内解析]
    C --> D[AST]
    D --> E[HTML 输出]
\`\`\`

### Mermaid 时序图

\`\`\`mermaid
sequenceDiagram
    participant U as 用户
    participant E as Engine
    U->>E: parse(md)
    E-->>U: AST
\`\`\`

### Mermaid 状态图

\`\`\`mermaid
stateDiagram-v2
    [*] --> 草稿
    草稿 --> 已发布: 发布
    已发布 --> [*]
\`\`\`

### graph 别名

\`\`\`graph
flowchart LR
    输入 --> 解析 --> 渲染
\`\`\`

### ECharts 柱状图

\`\`\`echarts
{
  "title": { "text": "月度访问" },
  "xAxis": { "type": "category", "data": ["Mon", "Tue", "Wed", "Thu", "Fri"] },
  "yAxis": { "type": "value" },
  "series": [{ "type": "bar", "data": [120, 200, 150, 80, 70] }]
}
\`\`\`

### ECharts 饼图 / 折线图

\`\`\`echarts
{
  "title": { "text": "占比", "left": "center" },
  "series": [{
    "type": "pie",
    "radius": "55%",
    "data": [
      { "value": 40, "name": "GFM" },
      { "value": 35, "name": "Penna" },
      { "value": 25, "name": "Custom" }
    ]
  }]
}
\`\`\`

\`\`\`echarts
{
  "title": { "text": "解析耗时 (ms)" },
  "xAxis": { "type": "category", "data": ["Q1", "Q2", "Q3", "Q4"] },
  "yAxis": { "type": "value" },
  "series": [{ "type": "line", "smooth": true, "data": [12, 18, 15, 9] }]
}
\`\`\`

### 普通围栏（非特殊类型）

\`\`\`math
\\frac{a}{b}
\`\`\`

\`\`\`katex
x^2 + y^2
\`\`\`

\`\`\`latex
\\documentclass{article}
\`\`\``,
  },
  {
    id: "card-basic",
    name: "基础卡片 (Card)",
    markdown: `::: card **加粗**标题

普通卡片，支持 **Markdown** 与列表：

- 要点一
- 要点二

\`\`\`js
console.log('card')
\`\`\`
:::`,
  },
  {
    id: "card-link",
    name: "链接卡片 (Link Card)",
    markdown: `### 带 icon

::: link-card 官方文档 link="https://github.com/Tencent/penna-markdown" icon="https://github.com/favicon.ico"

点击整卡跳转，左侧 icon。
:::

### image 作为 icon 别名

::: link-card 封面图 link="https://example.com" image="https://picsum.photos/80/80"

\`image=\` 是 \`icon=\` 别名。
:::

### 仅 URL 简写

::: link-card https://github.com
:::`,
  },
  {
    id: "card-image",
    name: "图片卡片 (Image Card)",
    markdown: `### 完整属性

::: image-card image="https://picsum.photos/640/360" title="示例图片" href="https://example.com" author="Demo Author" date="2024/08/16"

正文也可作为 description 渲染。
:::

### 仅 title

::: image-card title="仅 title 属性"
正文作为 description 渲染。
:::`,
  },
  {
    id: "card-repo",
    name: "仓库卡片 (Repo Card)",
    markdown: `::: repo-card vuepress/core
Official plugins and themes for VuePress2
:::

::: repo-card Tencent/penna-markdown
Tencent 开源的 Penna Markdown 编辑器。
:::

### 带 visibility

::: repo-card tencent/penna-markdown visibility="Public"
带 visibility 属性。
:::`,
  },
  {
    id: "card-grid",
    name: "卡片网格 (Card Grid)",
    markdown: `### 响应式列数

:::: card-grid cols="{ sm: 1, md: 2, lg: 3 }"

::: card 卡片 A
内容 A
:::

::: link-card 卡片 B link="https://example.com"
内容 B
:::

::: card 卡片 C
内容 C
:::

::::

### 均匀列数

:::: card-grid cols="2"

::: card 1
:::

::: card 2
:::

::::`,
  },
  {
    id: "card-masonry",
    name: "卡片瀑布流 (Masonry)",
    markdown: `:::: card-masonry cols="3" gap="16"

![1](https://picsum.photos/320/240)

![2](https://picsum.photos/320/180)

![3](https://picsum.photos/320/300)

![4](https://picsum.photos/320/220)

::: card 嵌套卡片
Masonry 内可混排卡片块。
:::

::::`,
  },
  {
    id: "field",
    name: "字段文档 (Field)",
    markdown: `:::: field-group

::: field theme
@type ThemeConfig
@required
@default { base: '/' }
主题配置对象，包含 base、lang 等。
:::

::: field enabled
@type boolean
@optional
@default true

是否启用该功能。
:::

::: field callback
@type (...args: any[]) => void
@optional
@default () => () => {}
[v1.0.0 新增]{.tip}

事件回调函数。
:::

::: field legacyMode
@type boolean
@deprecated
[v0.9.0 弃用]{.danger}

已弃用，将在下个大版本移除。
:::

::::`,
  },
  {
    id: "media",
    name: "媒体嵌入 (Media)",
    markdown: `### 视频

!video[演示视频](https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4)

!video[带 title](https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4 "视频说明")

!video[带封面](https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4){poster=https://picsum.photos/640/360}

### 音频

!audio[背景音乐](https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3)

!audio[带封面](https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3){poster=https://picsum.photos/320/180}

### iframe

!iframe[MDN 示例](https://developer.mozilla.org/zh-CN/)

!iframe[带 title](https://example.com "iframe 说明")

### 行内媒体（不渲染）

段落内 \`!video[alt](url)\` **不会**渲染播放器——须独立成行。`,
  },
  {
    id: "inline-mix",
    name: "行内语法混搭",
    markdown: `发布 **Penna Markdown** [v0.1.0]{.tip .top} ：支持 ==高亮==、!! 剧透 !! {click}、:rocket:、$E=mc^2$、H~2~O、[^ref] 脚注、%% 内部备注 %% 以及 [文档](https://github.com){.important}。

[^ref]: 混搭段落中的脚注定义。

### 标题 + 徽章

### 三级标题 [Beta]{.warning .top}

| 组合 | 示例 |
| --- | --- |
| 高亮+徽章 | ==重要== [New]{.danger} |
| 剧透+emoji | !! 秘密 !! :smile: |
| 公式+上下标 | $a^2$ / H~2~O |`,
  },
];
