import "../../_common/layout.scss";
import { TransformerEngine } from "@/transformer/index.js";
import { fetchDocContent } from "../../_common/api.js";

async function init() {
  const engine = new TransformerEngine();
  const input = document.getElementById("markdown-input") as HTMLTextAreaElement;
  const htmlOutput = document.getElementById("html-output")!!;
  const astOutput = document.getElementById("ast-output")!!;

  function update() {
    const val = input.value;
    const { ast } = engine.parse(val);
    const html = engine.render(ast);

    htmlOutput.textContent = html;
    
    // We stringify the AST but strip out circular refs if any, though MarkdownNode should be clean
    astOutput.textContent = JSON.stringify(ast, null, 2);
  }

  input.addEventListener("input", update);

  // Initial load from our docs to have some content
  const initialContent = await fetchDocContent("/docs/simple.md");
  input.value = initialContent;
  update();
}

init();
