import {
  findNext,
  replaceNext,
  replaceAll,
  closeSearchPanel,
  SearchQuery,
  setSearchQuery,
  getSearchQuery,
} from "@codemirror/search";
import type { EditorView, Panel } from "@codemirror/view";

export function createCustomSearchPanel(view: EditorView): Panel {
  const dom = document.createElement("div");
  dom.className = "cm-search cm-custom-search-panel";

  // Create search input
  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = "查找内容...";
  searchInput.className = "cm-textfield";

  // Create replace input
  const replaceInput = document.createElement("input");
  replaceInput.type = "text";
  replaceInput.placeholder = "替换为...";
  replaceInput.className = "cm-textfield";

  // Pre-fill existing query if available
  const existingQuery = getSearchQuery(view.state);
  if (existingQuery) {
    searchInput.value = existingQuery.search;
    replaceInput.value = existingQuery.replace;
  }

  const updateQueryAndDo = (action: (v: EditorView) => void) => {
    view.dispatch({
      effects: setSearchQuery.of(
        new SearchQuery({
          search: searchInput.value,
          replace: replaceInput.value,
        }),
      ),
    });
    action(view);
  };

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "下一个";
  nextBtn.onclick = () => updateQueryAndDo(findNext);

  const replaceBtn = document.createElement("button");
  replaceBtn.textContent = "替换";
  replaceBtn.onclick = () => updateQueryAndDo(replaceNext);

  const replaceAllBtn = document.createElement("button");
  replaceAllBtn.textContent = "全部替换";
  replaceAllBtn.onclick = () => updateQueryAndDo(replaceAll);

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "关闭";
  closeBtn.onclick = () => closeSearchPanel(view);

  dom.style.display = "flex";
  dom.style.flexDirection = "column";
  dom.style.gap = "8px";

  const row1 = document.createElement("div");
  row1.style.display = "flex";
  row1.style.gap = "8px";
  row1.style.alignItems = "center";

  const row2 = document.createElement("div");
  row2.style.display = "flex";
  row2.style.gap = "8px";
  row2.style.alignItems = "center";

  closeBtn.className = "cm-search-close-btn"; // Add a specific class to style it

  row1.appendChild(searchInput);
  row1.appendChild(nextBtn);
  row1.appendChild(closeBtn);

  row2.appendChild(replaceInput);
  row2.appendChild(replaceBtn);
  row2.appendChild(replaceAllBtn);

  dom.appendChild(row1);
  dom.appendChild(row2);

  searchInput.onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      updateQueryAndDo(findNext);
    }
  };

  replaceInput.onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      updateQueryAndDo(replaceNext);
    }
  };

  return {
    dom,
    top: true,
  };
}
