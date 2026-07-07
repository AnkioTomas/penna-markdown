import "@/theme/style/transformer.scss";
import "../../_common/layout.scss";

import { Renderer } from "@/renderer/Renderer.js";
import { Theme } from "@/theme/Theme.js";
import { fetchDocsList, fetchDocContent } from "../../_common/api.js";

async function init() {
  const container = document.getElementById("preview")!!;
  const renderer = new Renderer({ mount: container, theme: new Theme() });

  const docSelect = document.getElementById("doc-select") as HTMLSelectElement;
  const docs = await fetchDocsList();

  if (docs.length === 0) {
    docSelect.innerHTML = "<option>暂无文档</option>";
    return;
  }

  docSelect.innerHTML = "";
  for (const doc of docs) {
    const opt = document.createElement("option");
    opt.value = doc.href;
    opt.textContent = doc.name;
    docSelect.appendChild(opt);
  }

  // Handle doc change
  async function loadSelectedDoc() {
    const href = docSelect.value;
    const content = await fetchDocContent(href);
    
    // We render directly using the Renderer instance
    renderer.render(content);
  }

  docSelect.addEventListener("change", loadSelectedDoc);
  await loadSelectedDoc();
}

init();
