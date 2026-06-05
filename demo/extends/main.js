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

const DEFAULT_MARKDOWN = `# 扩展语法示例

**加粗**{class="highlight" data-id="1"}

*斜体*{id="em-1"}

[链接](https://example.com){target="_blank" rel="noopener"}

未启用扩展时，花括号会按普通文本渲染。
`;

const availableExtensions = getAvailableExtensions();
const selectedExtensions = new Set(["html_attrs"]);

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
