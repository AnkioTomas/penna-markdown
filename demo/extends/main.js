import { TransformerEngine } from "@/transformer/TransformerEngine.js";
import { getAvailableExtensions, createExtensionParsers } from "@/transformer/extends/extends.js";

const markdownInput = document.getElementById("markdown-input");
const preview = document.getElementById("preview");
const extensionsList = document.getElementById("extensions-list");
const rerunBtn = document.getElementById("rerun-btn");

const availableExtensions = getAvailableExtensions();
const selectedExtensions = new Set();

function render() {
  const md = markdownInput.value;
  const { inlineParsers, blockParsers } = createExtensionParsers({ names: [...selectedExtensions] });

  const engine = new TransformerEngine({
    inlineParsers,
    blockParsers,
  });

  const { html } = engine.render(md);
  preview.innerHTML = html;
}

function setupExtensions() {
  if (availableExtensions.length === 0) {
    extensionsList.innerHTML = "<p>暂无扩展（等待你实现 src/transformer/extends/*）</p>";
    return;
  }

  availableExtensions.forEach((extName) => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = extName;
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
  });
}

markdownInput.addEventListener("input", render);
rerunBtn.addEventListener("click", render);

// Initial render
setupExtensions();
render();
