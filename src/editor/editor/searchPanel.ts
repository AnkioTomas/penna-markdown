import {
  closeSearchPanel,
  findNext,
  findPrevious,
  getSearchQuery,
  replaceAll,
  replaceNext,
  SearchQuery,
  setSearchQuery,
} from "@codemirror/search";
import type { EditorView, Panel, ViewUpdate } from "@codemirror/view";

const ICON_PREV = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cherry-icon" aria-hidden="true"><polyline points="18 15 12 9 6 15"></polyline></svg>`;
const ICON_NEXT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cherry-icon" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
const ICON_CLOSE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cherry-icon" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

type Attrs = Record<string, string | boolean | ((e: Event) => void)>;

/**
 * 创建元素并应用属性、事件处理器与子节点。
 *
 * @param tag 要创建的 HTML 标签名。
 * @param attrs 元素属性或以 `on` 开头的事件处理器。
 * @param children 要追加的文本或 DOM 子节点。
 * @returns 已配置的元素。
 */
function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith("on") && typeof value === "function") {
      node.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
    } else if (typeof value === "boolean") {
      if (value) node.setAttribute(key, key);
    } else if (typeof value === "string") {
      node.setAttribute(key, value);
    }
  }
  for (const child of children) {
    node.appendChild(
      typeof child === "string" ? document.createTextNode(child) : child,
    );
  }
  return node;
}

/**
 * 创建带图标的搜索面板按钮。
 *
 * @param name 按钮名称。
 * @param label 用于无障碍提示的文本标签。
 * @param icon 按钮内的 SVG 标记。
 * @param onclick 点击时执行的操作。
 * @param extraClass 额外的 CSS 类名。
 * @returns 创建的按钮元素。
 */
function iconBtn(
  name: string,
  label: string,
  icon: string,
  onclick: () => void,
  extraClass = "",
): HTMLButtonElement {
  const btn = el("button", {
    type: "button",
    name,
    class: `cherry-search-btn ${extraClass}`.trim(),
    "aria-label": label,
    title: label,
    onclick: () => onclick(),
  });
  btn.innerHTML = icon;
  return btn;
}

/**
 * 创建带文本标签的搜索面板按钮。
 *
 * @param name 按钮名称。
 * @param label 按钮显示文本。
 * @param onclick 点击时执行的操作。
 * @returns 创建的按钮元素。
 */
function textBtn(
  name: string,
  label: string,
  onclick: () => void,
): HTMLButtonElement {
  return el(
    "button",
    {
      type: "button",
      name,
      class: "cherry-search-btn-text",
      onclick: () => onclick(),
    },
    [label],
  );
}

/**
 * 创建切换搜索选项的按钮。
 *
 * @param name 按钮名称。
 * @param label 按钮显示文本。
 * @param title 用于提示和无障碍说明的选项名称。
 * @param onclick 点击时执行的切换操作。
 * @returns 创建的按钮元素。
 */
function optionBtn(
  name: string,
  label: string,
  title: string,
  onclick: () => void,
): HTMLButtonElement {
  return el(
    "button",
    {
      type: "button",
      name,
      class: "cherry-search-option",
      "aria-label": title,
      title,
      onclick: () => onclick(),
    },
    [label],
  );
}

/**
 * 统计当前查询在文档中的匹配总数及当前选区所在匹配序号。
 *
 * @param view 要搜索的编辑器视图。
 * @param query 当前搜索查询。
 * @returns 当前匹配序号和匹配总数。
 */
function getMatchStats(
  view: EditorView,
  query: SearchQuery,
): { index: number; total: number } {
  if (!query.valid || !query.search) return { index: 0, total: 0 };

  const pos = view.state.selection.main.from;
  let total = 0;
  let index = 0;
  const cursor = query.getCursor(view.state, 0, view.state.doc.length);
  let match;
  while (!(match = cursor.next()).done) {
    total++;
    if (match.value.from <= pos && pos <= match.value.to) {
      index = total;
    }
  }
  return { index, total };
}

/**
 * 将匹配统计格式化为面板显示文本。
 *
 * @param index 当前匹配序号。
 * @param total 匹配总数。
 * @returns 用于显示的匹配统计文本。
 */
function formatMatchCount(index: number, total: number): string {
  if (total === 0) return "无结果";
  if (index === 0) return `${total} 处`;
  return `${index}/${total}`;
}

/** 提供查找、替换及搜索选项控制的 CodeMirror 搜索面板。 */
class CherrySearchPanel implements Panel {
  private readonly view: EditorView;
  private query: SearchQuery;
  private readonly searchField: HTMLInputElement;
  private readonly replaceField: HTMLInputElement;
  private readonly matchCount: HTMLSpanElement;
  private readonly caseBtn: HTMLButtonElement;
  private readonly regexpBtn: HTMLButtonElement;
  private readonly wordBtn: HTMLButtonElement;
  readonly dom: HTMLElement;

  /**
   * 创建搜索面板并用编辑器当前查询初始化控件。
   *
   * @param view 面板关联的编辑器视图。
   */
  constructor(view: EditorView) {
    this.view = view;
    this.query = getSearchQuery(view.state);
    this.commit = this.commit.bind(this);

    this.searchField = el("input", {
      value: this.query.search,
      placeholder: "查找内容…",
      "aria-label": "查找",
      class: "cm-textfield cherry-search-input",
      name: "search",
      form: "",
      "main-field": "true",
      oninput: this.commit,
      onchange: this.commit,
    });

    this.replaceField = el("input", {
      value: this.query.replace,
      placeholder: "替换为…",
      "aria-label": "替换",
      class: "cm-textfield cherry-search-input",
      name: "replace",
      form: "",
      oninput: this.commit,
      onchange: this.commit,
    });

    this.matchCount = el("span", {
      class: "cherry-search-count",
      "aria-live": "polite",
    });

    this.caseBtn = optionBtn("case", "Aa", "区分大小写", () =>
      this.toggleOption("caseSensitive"),
    );
    this.regexpBtn = optionBtn("regexp", ".*", "正则表达式", () =>
      this.toggleOption("regexp"),
    );
    this.wordBtn = optionBtn("word", "词", "全词匹配", () =>
      this.toggleOption("wholeWord"),
    );

    const searchRow = el("div", { class: "cherry-search-row" }, [
      el("span", { class: "cherry-search-label" }, ["查找"]),
      el("div", { class: "cherry-search-field" }, [
        this.searchField,
        this.matchCount,
      ]),
      el("div", { class: "cherry-search-actions" }, [
        iconBtn("prev", "上一个", ICON_PREV, () => this.run(findPrevious)),
        iconBtn("next", "下一个", ICON_NEXT, () => this.run(findNext)),
        iconBtn(
          "close",
          "关闭",
          ICON_CLOSE,
          () => closeSearchPanel(this.view),
          "cm-search-close-btn",
        ),
      ]),
    ]);

    const replaceActions = el("div", { class: "cherry-search-actions" }, [
      textBtn("replace", "替换", () => this.run(replaceNext)),
      textBtn("replaceAll", "全部替换", () => this.run(replaceAll)),
    ]);

    const replaceRow = el("div", { class: "cherry-search-row" }, [
      el("span", { class: "cherry-search-label" }, ["替换"]),
      el("div", { class: "cherry-search-field" }, [this.replaceField]),
      replaceActions,
    ]);

    const optionsRow = el("div", { class: "cherry-search-options" }, [
      this.caseBtn,
      this.regexpBtn,
      this.wordBtn,
    ]);

    const rows = [searchRow, optionsRow];
    if (!view.state.readOnly) {
      rows.splice(1, 0, replaceRow);
    }

    this.dom = el(
      "div",
      {
        class: "cm-search cherry-search-panel",
        onkeydown: (e) => this.keydown(e as KeyboardEvent),
      },
      rows,
    );

    this.syncQuery(this.query);
    this.refreshMatchCount();
  }

  /** 指示面板应显示在编辑器顶部。 */
  get top() {
    return true;
  }

  /** 面板挂载后聚焦并选中搜索输入框内容。 */
  mount() {
    this.searchField.focus();
    this.searchField.select();
  }

  /**
   * 同步外部查询变更，并在文档或选区变化后刷新匹配统计。
   *
   * @param update CodeMirror 视图更新信息。
   */
  update(update: ViewUpdate) {
    for (const tr of update.transactions) {
      for (const effect of tr.effects) {
        if (effect.is(setSearchQuery) && !effect.value.eq(this.query)) {
          this.syncQuery(effect.value);
        }
      }
    }
    if (update.selectionSet || update.docChanged) {
      this.refreshMatchCount();
    }
  }

  /**
   * 切换指定搜索选项并提交新查询。
   *
   * @param key 要切换的查询选项。
   */
  private toggleOption(key: "caseSensitive" | "regexp" | "wholeWord") {
    this.syncQuery(
      new SearchQuery({
        search: this.searchField.value,
        replace: this.replaceField.value,
        caseSensitive:
          key === "caseSensitive"
            ? !this.query.caseSensitive
            : this.query.caseSensitive,
        regexp: key === "regexp" ? !this.query.regexp : this.query.regexp,
        wholeWord:
          key === "wholeWord" ? !this.query.wholeWord : this.query.wholeWord,
      }),
    );
    this.commit();
  }

  /**
   * 将查询状态同步到输入框、选项按钮和匹配统计。
   *
   * @param query 要显示的搜索查询。
   */
  private syncQuery(query: SearchQuery) {
    this.query = query;
    this.searchField.value = query.search;
    this.replaceField.value = query.replace;
    this.caseBtn.classList.toggle("is-active", query.caseSensitive);
    this.regexpBtn.classList.toggle("is-active", query.regexp);
    this.wordBtn.classList.toggle("is-active", query.wholeWord);
    this.refreshMatchCount();
  }

  /** 将面板输入内容提交到 CodeMirror 搜索状态。 */
  private commit() {
    const query = new SearchQuery({
      search: this.searchField.value,
      replace: this.replaceField.value,
      caseSensitive: this.query.caseSensitive,
      regexp: this.query.regexp,
      wholeWord: this.query.wholeWord,
    });
    if (!query.eq(this.query)) {
      this.query = query;
      this.view.dispatch({ effects: setSearchQuery.of(query) });
    }
    this.refreshMatchCount();
  }

  /** 根据当前查询与选区更新匹配数量显示。 */
  private refreshMatchCount() {
    const { index, total } = getMatchStats(this.view, this.query);
    this.matchCount.textContent = formatMatchCount(index, total);
    this.matchCount.classList.toggle(
      "is-empty",
      total === 0 && !!this.query.search,
    );
  }

  /**
   * 提交输入后执行搜索命令，并刷新匹配统计。
   *
   * @param command 要对关联编辑器执行的 CodeMirror 搜索命令。
   */
  private run(command: (view: EditorView) => boolean) {
    this.commit();
    command(this.view);
    this.refreshMatchCount();
  }

  /**
   * 处理搜索和替换输入框中的 Enter 快捷键。
   *
   * @param e 触发面板事件的键盘事件。
   */
  private keydown(e: KeyboardEvent) {
    if (e.key === "Enter" && e.target === this.searchField) {
      e.preventDefault();
      this.run(e.shiftKey ? findPrevious : findNext);
    } else if (e.key === "Enter" && e.target === this.replaceField) {
      e.preventDefault();
      this.run(replaceNext);
    }
  }
}

/**
 * 创建 Cherry 定制的 CodeMirror 搜索面板。
 *
 * @param view 要关联的编辑器视图。
 * @returns 新建的搜索面板。
 */
export function createCustomSearchPanel(view: EditorView): Panel {
  return new CherrySearchPanel(view);
}
