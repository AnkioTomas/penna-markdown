import {
  getAvailableExtensions,
  createTransformerWithExtensions,
} from "@/transformer/extends/extends.js";
import "@/transformer/extends/style.css";
import { cardExamples } from "./card/index.js";
import { cherrySyntaxExamples } from "./cherry_syntax/index.js";

const markdownInput = document.getElementById("markdown-input");
const preview = document.getElementById("preview");
const htmlDisplay = document.getElementById("html-display");
const markdownDisplay = document.getElementById("markdown-display");
const syntaxList = document.getElementById("extensions-list");
const rerunBtn = document.getElementById("rerun-btn");
const statusEl = document.getElementById("status");

// 语法演示数据
const syntaxExamples = [
  {
    name: "highlight",
    desc: "行内高亮",
    markdown: "==高亮文本==\n\n==默认== ==重要=={.important} ==注意=={.note} ==提示=={.tip} ==警告=={.warning} ==谨慎=={.caution} ==危险=={.danger}",
    expected: '<p><mark>高亮文本</mark></p>\n<p><mark>默认</mark> <mark class="important">重要</mark> <mark class="note">注意</mark> <mark class="tip">提示</mark> <mark class="warning">警告</mark> <mark class="caution">谨慎</mark> <mark class="danger">危险</mark></p>'
  },
  { name: "emoji", desc: "Emoji 短码", markdown: ":smile: :thumbsup:", expected: "<p>😀 👍</p>" },
  {
    name: "html_attrs",
    desc: "HTML 属性",
    markdown: "**加粗**{.highlight}\n\n**加粗**{#special}\n\n**加粗**{#id .class}\n\n**加粗**{.a .b .c}\n\n**加粗**{class=\"highlight\" data-a=\"1\"}",
    expected: '<p><strong class="highlight">加粗</strong></p>\n<p><strong id="special">加粗</strong></p>\n<p><strong id="id" class="class">加粗</strong></p>\n<p><strong class="a b c">加粗</strong></p>\n<p><strong data-a="1" class="highlight">加粗</strong></p>'
  },
  {
    name: "spoiler",
    desc: "剧透遮罩",
    markdown: "悬浮显示：!! 这是剧透 !!\n\n点击显示：!! 点击揭晓 !! {click}",
    expected: '<p>悬浮显示：<span class="cherry-spoiler">这是剧透</span></p>\n<p>点击显示：<label class="cherry-spoiler click"><input type="checkbox" class="cherry-spoiler__toggle" hidden><span class="cherry-spoiler__text">点击揭晓</span></label></p>'
  },
  {
    name: "alert",
    desc: "提示框",
    markdown: "> [!NOTE]\n> 提示内容，读者应当了解的信息。\n\n> [!TIP]\n> 有用建议，帮助更好地完成任务。\n\n> [!IMPORTANT]\n> 关键信息，达成目标必须知道。\n\n> [!WARNING]\n> 警告信息，需要立即注意。\n\n> [!CAUTION]\n> 风险提示，某些行为可能有负面后果。",
    expected: '<div class="alert note">\n<p class="alert__title">Note</p>\n<p>提示内容，读者应当了解的信息。</p>\n</div>\n<div class="alert tip">\n<p class="alert__title">Tip</p>\n<p>有用建议，帮助更好地完成任务。</p>\n</div>\n<div class="alert important">\n<p class="alert__title">Important</p>\n<p>关键信息，达成目标必须知道。</p>\n</div>\n<div class="alert warning">\n<p class="alert__title">Warning</p>\n<p>警告信息，需要立即注意。</p>\n</div>\n<div class="alert caution">\n<p class="alert__title">Caution</p>\n<p>风险提示，某些行为可能有负面后果。</p>\n</div>'
  },
  {
    name: "tasklist",
    desc: "任务列表",
    markdown: "- [ ] 待办事项\n- [x] 已完成\n- [/] 进行中\n- [>] 延期/迁移\n- [<] 提前排期\n- [-] 已取消\n- [!] 紧急",
    expected: `<ul class="task-list">
<li class="task-item todo" data-state="todo"><span class="marker" role="img" aria-label="To-do"></span> 待办事项</li>
<li class="task-item done" data-state="done"><span class="marker" role="img" aria-label="Done"></span> 已完成</li>
<li class="task-item progress" data-state="in_progress"><span class="marker" role="img" aria-label="In progress"></span> 进行中</li>
<li class="task-item migrated" data-state="migrated"><span class="marker" role="img" aria-label="Migrated"></span> 延期/迁移</li>
<li class="task-item scheduled" data-state="scheduled"><span class="marker" role="img" aria-label="Scheduled"></span> 提前排期</li>
<li class="task-item cancelled" data-state="cancelled"><span class="marker" role="img" aria-label="Cancelled"></span> 已取消</li>
<li class="task-item urgent" data-state="urgent"><span class="marker" role="img" aria-label="Urgent"></span> 紧急</li>
</ul>`,
  },
  {
    name: "frontmatter",
    desc: "Frontmatter 与变量",
    markdown: `---
title: 演示文档
author:
  name: Cherry
---

# [[title]]

作者：[[author.name]]`,
    expected: "",
  },
  {
    name: "math",
    desc: "数学公式（$ 行内 / $$ 块级）",
    markdown: `## 行内公式

Euler's identity $e^{i\\pi}+1=0$ is a beautiful formula in $\\mathbb{R}^2$.

## 块级公式（同行）

$$E=mc^2$$

## 块级公式（分行）

$$
\\frac {\\partial^r} {\\partial \\omega^r} \\left(\\frac {y^{\\omega}} {\\omega}\\right)
= \\left(\\frac {y^{\\omega}} {\\omega}\\right) \\left\\{(\\log y)^r + \\sum_{i=1}^r \\frac {(-1)^ Ir \\cdots (r-i+1) (\\log y)^{ri}} {\\omega^i} \\right\\}
$$`,
    expected: "",
  },
  ...cherrySyntaxExamples,
  { name: "inline_comment", desc: "行内注释", markdown: "%% 注释 %%", expected: "<p></p>" },
  {
    name: "badge",
    desc: "徽章 [文本]{.variant .top}",
    markdown: `# 一级标题 [必须]{.important .top}

## 二级标题 [推荐]{.tip} [注意]{.warning .bottom}

### 三级标题 [默认] [置顶]{.top} [置底]{.bottom}

语法：\`[文本]\` 默认 middle；\`[文本]{.warning}\` 变体；\`[文本]{.top}\` / \`{.bottom}\` 位置。

变体：[note]{.note} [tip]{.tip} [warning]{.warning} [caution]{.caution} [danger]{.danger} [important]{.important}`,
    expected: "",
  },
  {
    name: "supsub",
    desc: "上标下标 ^上标^ ~下标~",
    markdown: "H~2~O，E=mc^2^，x^*a*^，~~删除线~~",
    expected: "<p>H<sub>2</sub>O，E=mc<sup>2</sup>，x<sup><em>a</em></sup>，<del>删除线</del></p>",
  },
  {
    name: "container",
    desc: "自定义容器 ::: type 标题",
    markdown: `::: note 📘 说明
与 alert 共用主题色与图标样式。
:::

::: tip 💡 提示
支持 **Markdown** 与列表。
:::

::: important ⭐ 重要
关键信息请放在这里。
:::

::: warning ⚠️ 警告
操作前请确认。
:::

::: caution 🛑 谨慎
可能有负面后果。
:::

::: danger 🚨 危险
删除前请备份。
:::

::: info ℹ️ 信息
补充说明，使用品牌色。
:::

::: left
左对齐文本
:::

::: center
居中文本
:::

::: right
右对齐文本
:::

::: justify
两端对齐文本
:::`,
    expected: "",
  },
  ...cardExamples,
  {
    name: "tabs",
    desc: "选项卡（可多组）",
    markdown: `::: tabs
@tab 第一组 · 标签 A
第一组内容 A
@tab:active 第一组 · 标签 B
第一组内容 B（默认激活）
:::

::: tabs
@tab 第二组 · 标签 X
第二组内容 X
@tab 第二组 · 标签 Y
第二组内容 Y（默认第一个）
:::`,
    expected: "",
  },
  {
    name: "steps",
    desc: "步骤条",
    markdown: `::: steps

1. 步骤 1

\`\`\`ts
console.log('Hello World!')
\`\`\`

2. 步骤 2

这里是步骤 2 的相关内容

3. 步骤 3

::: tip 提示
提示容器
:::

4. 结束

:::`,
    expected: "",
  },
  {
    name: "field",
    desc: "字段文档",
    markdown: `:::: field-group
::: field theme
@type ThemeConfig
@required
@default { base: '/' }
主题配置
:::

::: field enabled
@type boolean
@optional
@default true

是否启用
:::

::: field callback
@type (...args: any[]) => void
@optional
@default () => (){}
[v1.0.0 新增]{.tip}

回调函数
:::

::: field other
@type string
@deprecated

[v0.9.0 弃用]{.danger}

已弃用属性
:::
::::`,
    expected: "",
  },
  {
    name: "timeline",
    desc: "时间线",
    markdown: `## 基础垂直 · 节点类型与彩色线条

::: timeline
- 节点一
  time=2025-03-20 type=success

  成功类型，线条与圆点同色。

- 节点二
  time=2025-04-20 type=warning

  警告类型。

- 节点三
  time=2025-01-22 type=danger

  危险类型。

- 节点四
  time=2025-06-01 type=important

  重要类型。
:::

## 多行标题

::: timeline
- 主标题
  副标题（同属标题行）
  time=2025-03-20 type=tip

  标题可跨多行，配置行紧跟最后一行标题之后。
:::

## 线条风格（容器默认 + 单项覆盖）

::: timeline line="dotted"
- 节点一
  time=2025-03-20

  继承容器 dotted 线条。

- 节点二
  time=2025-04-20 type=success line=dashed

  单项覆盖为 dashed。

- 节点三
  time=2025-01-22 type=danger line=solid

  单项覆盖为 solid。
:::

## 右对齐

::: timeline placement="right"
- 节点一
  time=2025-03-20 type=success

  内容在时间轴右侧。

- 节点二
  time=2025-04-20 type=warning

  右对齐布局。
:::

## 两端对齐

::: timeline placement="between"
- 节点一
  time=2025-03-20 placement=right type=success

  本项在右侧。

- 节点二
  time=2025-04-20 type=warning

  本项在左侧（默认）。

- 节点三
  time=2025-01-22 type=danger placement=right

  再次右侧。
:::

## 自定义颜色

::: timeline
- 自定义色
  time=2025-03-20 color=#3cf

  color 覆盖线条与圆点颜色。
:::`,
    expected: "",
  },
  {
    name: "collapse",
    desc: "折叠面板",
    markdown: `## 基本用法

::: collapse
- 标题 1

  正文内容

- 标题 2

  正文内容
:::

## 默认全部展开

::: collapse expand
- 标题 1

  正文内容

- 标题 2

  正文内容
:::

## 手风琴模式

::: collapse accordion
- 标题 1

  正文内容

- 标题 2

  正文内容

- 标题 3

  正文内容
:::

## :+ 标记展开

::: collapse
- 标题 1

  正文内容

- :+ 标题 2

  展开内容

- :+ 标题 3

  也展开
:::

## :- 标记折叠（expand 时）

::: collapse expand
- 标题 1

  正文内容

- :- 标题 2

  折叠内容

- 标题 3

  展开内容
:::`,
    expected: "",
  },
  {
    name: "iframe",
    desc: "内嵌 iframe",
    markdown: "!iframe[演示页面](https://example.com)",
    expected: "",
  },
  {
    name: "media",
    desc: "媒体元素",
    markdown: `!video[演示视频](https://example.com/demo.mp4)

!audio[背景音乐](https://example.com/a.mp3)

!audio[带封面](https://example.com/a.mp3){poster=https://example.com/cover.png}

!video[带封面](https://example.com/demo.mp4){poster=https://example.com/poster.png}`,
    expected: "",
  },
  { name: "footnote", desc: "脚注", markdown: "需要解释[^1]。\n\n[^1]: 脚注内容", expected: "<p>需要解释<sup class=\"footnote-ref\"><a href=\"#footnote-1\" id=\"footnote-ref-1\">1</a></sup>。</p>\n<div class=\"footnotes\">\n<hr class=\"footnotes-sep\">\n<section class=\"footnotes\">\n<ol class=\"footnotes-list\">\n<li id=\"footnote-1\" class=\"footnote-item\">\n<p>脚注内容 <a href=\"#footnote-ref-1\" class=\"footnote-backref\">↩</a></p>\n</li>\n</ol>\n</section>\n</div>" },
];

const DEFAULT_MARKDOWN = `---
title: 扩展演示
author:
  name: Cherry
---

# [[title]]

作者：[[author.name]]

# 扩展语法示例

核心库 [[必须:important,top]]，可选组件 [[可选:tip,top]]

E=mc^2^，H^^2^^O，大头 ^儿子^ 和 ^^爸爸^^

==高亮文本== %% 编辑备注，读者看不到 ==

下面有 !! 这是剧透 !! 请悬停查看

==高亮文本== ==重要=={.important} ==注意=={.note} ==提示=={.tip}

*斜体*{id="em-1"}

[链接](https://example.com){target="_blank" rel="noopener"}

:smile: :thumbsup: :+1: :赞:

::: tip 💡 这是一个小提示
这里是提示的内容。
:::

::: danger 🚨 危险操作
删除数据库前请务必备份！
:::

::: left
左对齐的内容
:::

::: center
居中的内容
:::

::: right
右对齐的内容
:::

::: justify
两端对齐的内容
:::

::: tabs

@tab 标题 1

第一个选项卡内容

@tab 标题 2

第二个选项卡内容

@tab:active 标题 3

默认激活的第三个选项卡

:::

同一页面可并列多组选项卡：

::: tabs

@tab 概览

第二组：概览内容

@tab:active 配置

第二组：配置内容（默认激活）

@tab 日志

第二组：日志内容

:::

::: collapse expand
- 点击展开更多

  默认展开的面板内容

- :- 默认收起

  此项初始折叠
:::

!iframe[演示页面](https://example.com)

!video[演示视频](https://example.com/demo.mp4)

!audio[背景音乐](https://example.com/a.mp3)

!audio[带封面](https://example.com/a.mp3){poster=https://example.com/cover.png}

!video[带封面](https://example.com/demo.mp4){poster=https://example.com/poster.png}

这是一个需要解释的专业词汇[^1]。

[^1]: 这里是放在文章末尾的详细解释，点击数字可以自动跳转。

> [!NOTE]
> Useful information that users should know, even when skimming content.

> [!TIP]
> Helpful advice for doing things better or more easily.

> [!IMPORTANT]
> Key information users need to know to achieve their goal.

> [!WARNING]
> Urgent info that needs immediate user attention to avoid problems.

> [!CAUTION]
> Advises about risks or negative outcomes of certain actions.

- [ ] 待办事项
- [x] 已完成
- [/] 进行中
- [>] 延期
- [<] 排期
- [-] 已取消
- [!] 紧急

Euler's identity $e^{i\\pi}+1=0$ is a beautiful formula in $\\mathbb{R}^2$.

$$
E=mc^2
$$

\`\`\`echarts
{"title":{"text":"Demo"},"series":[{"type":"pie","data":[{"value":1,"name":"A"}]}]}
\`\`\`

\`\`\`mermaid
flowchart TD
    Start --> Stop
\`\`\`

未启用扩展时，==高亮== 与花括号会按普通文本渲染。
`;

let currentSyntaxIndex = 0;

function getSelectedNames() {
  return []; // 所有扩展默认启用
}

function normalizeHtml(html) {
  return String(html).replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

function render() {
  const md = markdownInput.value;
  const names = getAvailableExtensions(); // 默认启用所有扩展

  const engine = createTransformerWithExtensions(names);
  const { ast } = engine.parse(md);
  const { html } = engine.render(ast);

  preview.innerHTML = html;
  markdownDisplay.textContent = md;
  htmlDisplay.textContent = html;

  const extLabel = names.length ? names.join(", ") : "无";
  statusEl.textContent = `已启用扩展：${extLabel} · ${new Date().toLocaleTimeString()}`;
}

function renderSyntaxList() {
  syntaxList.innerHTML = "";
  
  syntaxExamples.forEach((syntax, index) => {
    const item = document.createElement("div");
    item.className = "syntax-item";
    if (index === currentSyntaxIndex) {
      item.classList.add("active");
    }
    
    item.innerHTML = `
      <div class="syntax-name">${syntax.name}</div>
      <div class="syntax-desc">${syntax.desc}</div>
    `;
    
    item.addEventListener("click", () => {
      currentSyntaxIndex = index;
      updateCurrentSyntax();
    });
    
    syntaxList.appendChild(item);
  });
}

function updateCurrentSyntax() {
  // 更新高亮
  const items = syntaxList.querySelectorAll(".syntax-item");
  items.forEach((item, index) => {
    item.classList.toggle("active", index === currentSyntaxIndex);
  });
  
  // 填充当前语法的示例
  const current = syntaxExamples[currentSyntaxIndex];
  markdownInput.value = current.markdown;
  htmlDisplay.textContent = current.expected;
  preview.innerHTML = "";
  
  render();
}

// 初始化：渲染语法列表和默认示例

markdownInput.value = DEFAULT_MARKDOWN;

// 渲染语法列表到 sidebar
syntaxList.innerHTML = "";
syntaxExamples.forEach((syntax, index) => {
  const item = document.createElement("div");
  item.className = "syntax-item";
  if (index === currentSyntaxIndex) {
    item.classList.add("active");
  }
  
  item.innerHTML = `
    <div class="syntax-name">${syntax.name}</div>
    <div class="syntax-desc">${syntax.desc}</div>
  `;
  
  item.addEventListener("click", () => {
    currentSyntaxIndex = index;
    updateCurrentSyntax();
  });
  
  syntaxList.appendChild(item);
});

updateCurrentSyntax();

markdownInput.addEventListener("input", render);
rerunBtn.addEventListener("click", render);

window.cherryExtendsDemo = { render, updateCurrentSyntax };
