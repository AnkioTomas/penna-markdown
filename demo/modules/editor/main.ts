import "@/theme/style/cherry.scss";
import "@/theme/style/transformer.scss";
import "../../_common/layout.scss";

import { Cherry } from "@/editor/Cherry.js";
import { setupThemeAndAppearance } from "../../_common/theme.js";
import {
  fetchDocsList,
  fetchDocContent,
  fetchMarkdownFileItems,
} from "../../_common/api.js";

const DOCS_DIR = "/docs/";

async function init() {
  const docSelect = document.getElementById("doc-select") as HTMLSelectElement;
  const docs = await fetchDocsList(DOCS_DIR);

  let editor: Cherry;

  async function loadDoc(href: string) {
    const content = await fetchDocContent(href);
    editor.setMarkdown(content);
    editor.setSidebarActiveFile(href);
    if (docSelect) docSelect.value = href;
  }

  editor = new Cherry(document.querySelector("#cherry-editor")!!, {
    debug: true,
    editor: { value: "加载中..." },
    sidebar: {
      fetchFiles: () => fetchMarkdownFileItems(DOCS_DIR),
      onFileClick: (fileId) => loadDoc(fileId),
    },
  });

  setupThemeAndAppearance(editor);

  if (docs.length === 0) {
    if (docSelect) docSelect.innerHTML = "<option>暂无文档</option>";
    editor.setMarkdown("请确保 docs 目录下有 Markdown 文件（pnpm demo 下访问 /docs/?json）");
    return;
  }

  if (docSelect) {
    docSelect.innerHTML = "";
    for (const doc of docs) {
      const opt = document.createElement("option");
      opt.value = doc.href;
      opt.textContent = doc.name;
      docSelect.appendChild(opt);
    }
    docSelect.addEventListener("change", () => loadDoc(docSelect.value));
  }

  await loadDoc(docs[0].href);
}

init();
