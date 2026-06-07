import {
  getAvailableExtensions,
  createTransformerWithExtensions,
} from "@/transformer/extends/extends.js";

const markdownInput = document.getElementById("markdown-input");
const preview = document.getElementById("preview");
const htmlOutput = document.getElementById("html-output");
const astOutput = document.getElementById("ast-output");
const extensionsList = document.getElementById("extensions-list");
const rerunBtn = document.getElementById("rerun-btn");
const statusEl = document.getElementById("status");

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

const availableExtensions = getAvailableExtensions();
const selectedExtensions = new Set([
  "highlight",
  "spoiler",
  "html_attrs",
  "emoji",
  "alert",
  "extended_tasklist",
  "cherry_syntax",
  "frontmatter",
  "inline_comment",
  "badge",
  "supsub",
  "iframe",
  "media",
  "container",
  "footnote",
]);

function getSelectedNames() {
  return [...selectedExtensions];
}

function render() {
  const md = markdownInput.value;
  const names = getSelectedNames();

  const engine = createTransformerWithExtensions(names);
  const { ast } = engine.parse(md);
  const { html } = engine.render(ast);

  preview.innerHTML = html;
  htmlOutput.textContent = html;
  astOutput.textContent = JSON.stringify(ast, null, 2);

  const extLabel = names.length ? names.join(", ") : "无";
  statusEl.textContent = `已启用扩展：${extLabel} · ${new Date().toLocaleTimeString()}`;
}

function setupExtensions() {
  extensionsList.innerHTML = "";

  if (availableExtensions.length === 0) {
    extensionsList.innerHTML =
      "<p class=\"ext-empty\">暂无扩展（在 src/transformer/extends/ 中实现）</p>";
    return;
  }

  for (const extName of availableExtensions) {
    const label = document.createElement("label");
    label.className = "ext-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = extName;
    checkbox.checked = selectedExtensions.has(extName);
    checkbox.addEventListener("change", (e) => {
      if (e.target.checked) {
        selectedExtensions.add(extName);
      } else {
        selectedExtensions.delete(extName);
      }
      render();
    });

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(extName));
    extensionsList.appendChild(label);
  }
}

markdownInput.value = DEFAULT_MARKDOWN;
markdownInput.addEventListener("input", render);
rerunBtn.addEventListener("click", render);

setupExtensions();
render();

window.cherryExtendsDemo = { render, getSelectedNames };
