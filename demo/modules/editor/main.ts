import "@/theme/style/cherry.scss";
import "@/theme/style/transformer.scss";
import "../../_common/layout.scss";

import { Cherry } from "@/editor/Cherry.js";
import { setupThemeAndAppearance } from "../../_common/theme.js";
import { fetchDocsList, fetchDocContent } from "../../_common/api.js";

async function init() {
  const editor = new Cherry(document.querySelector("#cherry-editor")!!, {
    debug: true,
    editor: { value: "加载中..." },
  });

  setupThemeAndAppearance(editor);

  const docSelect = document.getElementById("doc-select") as HTMLSelectElement;
  const docs = await fetchDocsList();

  if (docs.length === 0) {
    docSelect.innerHTML = "<option>暂无文档</option>";
    editor.setMarkdown("请确保 /docs 目录下有 Markdown 文件");
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
    editor.setMarkdown(content);
  }

  docSelect.addEventListener("change", loadSelectedDoc);

  // Load initial doc
  await loadSelectedDoc();
}

init();
