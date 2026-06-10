import {
  getAvailableExtensions,
  createTransformerWithExtensions,
} from "@/transformer/extends/extends.js";
import "@/transformer/extends/style.css";

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
    desc: "Frontmatter（变量 + 特殊块）",
    markdown: `---
title: 演示文档
author:
  name: Cherry
---

# [[title]]

作者：[[author.name]]

$$
E=mc^2
$$

\`\`\`mermaid
flowchart TD
    A --> B
\`\`\``,
    expected: "",
  },
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
  {
    name: "card",
    desc: "卡片 card / link-card / image-card",
    markdown: `::: card title="标题"

普通卡片内容。
:::

::: link-card title="文档" link="https://example.com"

点击整卡跳转到外部链接。
:::

::: image-card image="https://cn.bing.com/th?id=OHR.AlfanzinaLighthouse_ZH-CN9704515669_1920x1080.webp" title="阿尔凡齐纳灯塔，阿尔加维，葡萄牙" href="/" author="Andreas Kunz" date="2024/08/16"

今天照片中的灯塔位于葡萄牙南部海岸阿尔加维的卡沃埃罗。
:::

:::: card-grid cols="{ sm: 1, md: 2, lg: 2 }"

::: link-card title="指南" link="https://example.com/guide"

快速上手。
:::

::: image-card image="https://example.com/photo.webp" title="示例图片" author="Alice"

网格中的图片卡片。
:::

::::`,
    expected: "",
  },
  { name: "tabs", desc: "选项卡", markdown: "::: tabs\n@tab 标题 1\n内容\n:::", expected: "<div class=\"cherry-tabs\">\n<input type=\"radio\" name=\"tabs\" id=\"tab-0\" checked>\n<label for=\"tab-0\" class=\"cherry-tabs__label\">标题 1</label>\n<div class=\"cherry-tabs__panel\">\n<p>内容</p>\n</div>\n<div class=\"cherry-tabs__content\"></div>\n</div>" },
  { name: "detail", desc: "展开收起", markdown: "+++ 点击展开\n内容\n+++", expected: "<details class=\"cherry-detail\"><summary>点击展开</summary>\n<p>内容</p>\n</details>" },
  { name: "iframe", desc: "内嵌 iframe", markdown: "!iframe[演示](https://example.com)", expected: "<div class=\"cherry-iframe\" style=\"aspect-ratio: 16 / 9;\"><iframe src=\"https://example.com\" allowfullscreen=\"allowfullscreen\"></iframe></div>" },
  { name: "media", desc: "媒体元素", markdown: "!video[演示](https://example.com/demo.mp4)", expected: "<div class=\"cherry-video\"><video src=\"https://example.com/demo.mp4\" controls=\"controls\"></video></div>" },
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

+++ 点击展开更多
++- 默认展开
展开的内容
++ 默认收起
收起的内容
+++

@@https://example.com

!video[演示视频](https://example.com/demo.mp4)

!audio[背景音乐](https://example.com/a.mp3)

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

\`\`\`card
#list/2
[文档](https://example.com) Cherry 扩展语法说明
[演示](https://example.com) 在线体验编辑器
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
