import { createTransformer } from "../../src/transformer/index.js";
import example from "../test.md?raw";

const transformer = createTransformer();

const markdownInput = document.querySelector("#markdown");
const htmlOutput = document.querySelector("#html-output");
const preview = document.querySelector("#preview");
const resetBtn = document.querySelector("#reset-btn");

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

