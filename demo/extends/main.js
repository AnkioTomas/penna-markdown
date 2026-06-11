import {
  getAvailableExtensions,
  createTransformerWithExtensions,
} from "@/transformer/index.js";
import { hydrateCherryTheme } from "@/renderer/cherryTheme.js";
import "../highlight-setup.js";
import "../theme-watch.js";
import { cardExamples } from "./card/index.js";
import { cherrySyntaxExamples } from "./cherry_syntax/index.js";
import codeBlockExample from "./code_block/index.js";
import mediaExample from "./media.js";

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
  },
  {
    name: "emoji",
    desc: "Emoji 短码 :name:",
    markdown: `:smile: :thumbsup: :heart: :rocket: :tada: :+1:

常用：:warning: :bulb: :star: :fire: :sparkles: :check: :赞:`,
  },
  {
    name: "html_attrs",
    desc: "HTML 属性",
    markdown: "**加粗**{.highlight}\n\n**加粗**{#special}\n\n**加粗**{#id .class}\n\n**加粗**{.a .b .c}\n\n**加粗**{class=\"highlight\" data-a=\"1\"}",
  },
  {
    name: "spoiler",
    desc: "剧透遮罩",
    markdown: "悬浮显示：!! 这是剧透 !!\n\n点击显示：!! 点击揭晓 !! {click}",
  },
  {
    name: "alert",
    desc: "提示框",
    markdown: "> [!NOTE]\n> 提示内容，读者应当了解的信息。\n\n> [!TIP]\n> 有用建议，帮助更好地完成任务。\n\n> [!IMPORTANT]\n> 关键信息，达成目标必须知道。\n\n> [!WARNING]\n> 警告信息，需要立即注意。\n\n> [!CAUTION]\n> 风险提示，某些行为可能有负面后果。",
  },
  {
    name: "tasklist",
    desc: "任务列表",
    markdown: "- [ ] 待办事项\n- [x] 已完成\n- [/] 进行中\n- [>] 延期/迁移\n- [<] 提前排期\n- [-] 已取消\n- [!] 紧急",
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
  },
  ...cherrySyntaxExamples,
  codeBlockExample,
  {
    name: "inline_comment",
    desc: "行内注释 %% ... %%",
    markdown: `可见文字 %% 读者不可见的编辑备注 %% 继续书写。

整段注释：%% 这一段不会出现在 HTML 里 %%`,
  },
  {
    name: "badge",
    desc: "徽章 [文本]{.variant .top}",
    markdown: `# 一级标题 [必须]{.important .top}

## 二级标题 [推荐]{.tip} [注意]{.warning .bottom}

### 三级标题 [默认] [置顶]{.top} [置底]{.bottom}

语法：\`[文本]\` 默认 middle；\`[文本]{.warning}\` 变体；\`[文本]{.top}\` / \`{.bottom}\` 位置。

变体：[note]{.note} [tip]{.tip} [warning]{.warning} [caution]{.caution} [danger]{.danger} [important]{.important}`,
  },
  {
    name: "supsub",
    desc: "上标下标 ^上标^ ~下标~",
    markdown: "H~2~O，E=mc^2^，x^*a*^，~~删除线~~",
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
  },
  {
    name: "iframe",
    desc: "内嵌 iframe",
    markdown: "!iframe[演示页面](https://example.com)",
  },
  mediaExample,
  {
    name: "footnote",
    desc: "脚注（全面演示）",
    markdown: `## 基础引用

人生自古谁无死[^poem]，留取丹心照汗青。

[^poem]: 出自 宋·文天祥 **《过零丁洋》**

## 多个脚注

Cherry Markdown[^cherry] 支持 GFM 风格脚注[^gfm]，点击上标可跳转到文末。

[^cherry]: Cherry Markdown Next 扩展语法演示项目。
[^gfm]: GitHub Flavored Markdown 规范中的脚注扩展。

## 重复引用同一脚注

第一次提到 VuePress[^vp]，后文再次引用 VuePress[^vp]，两次上标编号相同。

[^vp]: VuePress 是 Vue 驱动的静态站点生成器。

重复引用时，文末 ↩︎ 始终回到**第一次**出现的位置（\`footnote-ref-1\`）。

## 引用顺序决定编号

先引用 B[^b]，再引用 A[^a]；编号按**首次引用**排序，而非定义顺序。

[^a]: 定义写在后面，但编号靠后。
[^b]: 定义写在后面，但编号靠前。

## 富文本脚注

详见 [官方文档](https://example.com/docs)[^doc] 与 \`inline code\`[^code] 示例。

[^doc]: 支持 **加粗**、*斜体*、[链接](https://example.com) 等 Markdown。
[^code]: 行内代码与列表也支持：

  - 要点一
  - 要点二

## 多行脚注正文

扩展语法[^ext] 可在定义后继续换行书写，直到空行或下一条定义。

[^ext]: 第一行说明。

  第二行补充内容，属于同一条脚注。`,
  },
];

let currentSyntaxIndex = 0;

function render() {
  const md = markdownInput.value;
  const names = getAvailableExtensions(); // 默认启用所有扩展

  const engine = createTransformerWithExtensions(names);
  const { ast } = engine.parse(md);
  const { html } = engine.render(ast);

  preview.innerHTML = html;
  hydrateCherryTheme(preview);
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
  const items = syntaxList.querySelectorAll(".syntax-item");
  items.forEach((item, index) => {
    item.classList.toggle("active", index === currentSyntaxIndex);
  });

  markdownInput.value = syntaxExamples[currentSyntaxIndex].markdown;
  render();
}

renderSyntaxList();
updateCurrentSyntax();

markdownInput.addEventListener("input", render);
rerunBtn.addEventListener("click", render);

window.cherryExtendsDemo = { render, updateCurrentSyntax };
