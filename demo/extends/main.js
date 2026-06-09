import {
  getAvailableExtensions,
  createTransformerWithExtensions,
} from "@/transformer/extends/extends.js";

const markdownInput = document.getElementById("markdown-input");
const preview = document.getElementById("preview");
const htmlDisplay = document.getElementById("html-display");
const markdownDisplay = document.getElementById("markdown-display");
const syntaxList = document.getElementById("extensions-list");
const rerunBtn = document.getElementById("rerun-btn");
const statusEl = document.getElementById("status");

// 语法演示数据
const syntaxExamples = [
  { name: "highlight", desc: "行内高亮语法", markdown: "==高亮文本==", expected: "<p><mark>高亮文本</mark></p>" },
  { name: "emoji", desc: "Emoji 短码", markdown: ":smile: :thumbsup:", expected: "<p>😀 👍</p>" },
  { name: "html_attrs", desc: "HTML 属性", markdown: "**加粗**{class=\"highlight\"}", expected: "<p><strong class=\"highlight\">加粗</strong></p>" },
  { name: "spoiler", desc: "剧透遮罩", markdown: "!!这是剧透!!", expected: "<p><span class=\"cherry-spoiler\">这是剧透</span></p>" },
  { name: "alert", desc: "提示框", markdown: "> [!NOTE]\n> 提示内容", expected: "<div class=\"cherry-alert cherry-alert-note\">\n<strong>NOTE</strong>\n<p>提示内容</p>\n</div>" },
  { name: "extended_tasklist", desc: "任务列表", markdown: "- [ ] 待办\n- [x] 完成", expected: "<ul class=\"contains-task-list\">\n<li class=\"task-list-item\"><input type=\"checkbox\" class=\"task-list-item-checkbox\" disabled> 待办</li>\n<li class=\"task-list-item\"><input type=\"checkbox\" class=\"task-list-item-checkbox\" disabled checked> 完成</li>\n</ul>" },
  { name: "cherry_syntax", desc: "Cherry 语法", markdown: "# [[title]]", expected: "<h1>演示</h1>" },
  { name: "frontmatter", desc: "Frontmatter", markdown: "---\ntitle: 文档\n---", expected: "<pre style=\"display:none\">title: 文档\n</pre>" },
  { name: "inline_comment", desc: "行内注释", markdown: "%% 注释 %%", expected: "<p></p>" },
  { name: "badge", desc: "徽章", markdown: "![test](https://img.shields.io/badge/test-green)", expected: "<span class=\"cherry-badge cherry-badge-green\">test</span>" },
  { name: "supsub", desc: "上标下标", markdown: "H~2~O，E=mc^2^", expected: "<p>H<sub>2</sub>O，E=mc<sup>2</sup></p>" },
  { name: "container", desc: "自定义容器", markdown: "::: tip\n内容\n:::", expected: "<div class=\"cherry-container cherry-container-tip\">\n<div class=\"cherry-container__header\">TIP</div>\n<div class=\"cherry-container__body\">\n<p>内容</p>\n</div>\n</div>" },
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

**加粗**{class="highlight" data-id="1"}

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
