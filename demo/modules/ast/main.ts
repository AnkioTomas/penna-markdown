import "../../_common/layout.scss";
import { TransformerEngine } from "@/transformer/index.js";
import { fetchDocContent } from "../../_common/api.js";

async function init() {
  const engine = new TransformerEngine();
  const input = document.getElementById("markdown-input") as HTMLTextAreaElement;
  const astOutput = document.getElementById("ast-output")!!;

  function update() {
    const val = input.value;
    const { ast } = engine.parse(val);
    astOutput.textContent = JSON.stringify(ast, null, 2);
  }

  input.addEventListener("input", update);

  const initialContent = await fetchDocContent("/docs/simple.md");
  input.value = initialContent;
  update();
}

init();
