import { CherryTransformer } from "../../src/transformer/index.js";

const transformer = new CherryTransformer();

const markdownInput = document.querySelector("#markdown");
const htmlOutput = document.querySelector("#html-output");
const preview = document.querySelector("#preview");
const resetBtn = document.querySelector("#reset-btn");

const example = `# Markdown 转 HTML

这是一个简单的转换器演示：

- 输入 Markdown
- 实时生成 HTML

\`\`\`js
alert("hello");
\`\`\`
`;

markdownInput.value = example;

function renderNow() {
  const md = markdownInput.value ?? "";
  const { html } = transformer.render(md);
  htmlOutput.textContent = html;
  preview.innerHTML = html;
}

let t = 0;
markdownInput.addEventListener("input", () => {
  window.clearTimeout(t);
  t = window.setTimeout(renderNow, 60);
});

resetBtn.addEventListener("click", () => {
  markdownInput.value = example;
  renderNow();
});

renderNow();

window.cherryConverterDemo = { transformer, renderNow };

