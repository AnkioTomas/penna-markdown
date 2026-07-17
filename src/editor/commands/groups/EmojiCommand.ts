/**
 * Emoji 插入命令。
 * 重构为分类选项卡 + 搜索的高级面板。
 */
import type { EditorView } from "@codemirror/view";
import { requestDialog } from "@/editor/dialog/requestDialog.js";
import {
  Command,
  insertText,
  type CommandContext,
} from "@/editor/commands/Command";
import type {
  DialogCallbacks,
  DialogCapableCommand,
} from "@/editor/commands/DialogCommand";
import type { DialogType } from "@/editor/commands/dialogTypes";
import emojiFull from "@/transformer/extends/inline/emoji/full.js";
import { emojiCategories } from "@/editor/commands/groups/emojiCategories.js";

/** `emoji` 弹窗提交结果：shortcode 字符串。 */
export interface EmojiDialogResult {
  code: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  "Smileys & Emotion": "😀",
  "People & Body": "🧑",
  "Animals & Nature": "🐻",
  "Food & Drink": "🍔",
  "Travel & Places": "🚗",
  Activities: "⚽",
  Objects: "💡",
  Symbols: "❤️",
  Flags: "🚩",
};

/**
 * 构建 Emoji 分类和搜索选择面板。
 * @param host - 弹窗内容挂载元素
 * @param _props - 未使用的弹窗预填充属性
 * @param callbacks - 选择 shortcode 或取消时的回调
 * @returns 销毁面板 DOM 的清理函数
 */
function renderEmojiDialog(
  host: HTMLElement,
  _props: Record<string, unknown>,
  callbacks: DialogCallbacks<EmojiDialogResult>,
): () => void {
  const wrap = document.createElement("div");
  wrap.className = "penna-dialog-form penna-dialog-form--emoji";

  const categories = Object.keys(emojiCategories);

  wrap.innerHTML = `
    <div class="penna-dialog-table-head" style="padding-bottom: 8px;">
      <span class="penna-dialog-table-title">插入 Emoji</span>
    </div>
    <div class="penna-emoji-tabs">
      ${categories
        .map(
          (cat) =>
            `<button type="button" class="penna-emoji-tab ${cat === categories[0] ? "active" : ""}" data-category="${cat}" title="${cat}">${CATEGORY_ICONS[cat] || "✨"}</button>`,
        )
        .join("")}
    </div>
    <label class="penna-dialog-field" style="padding: 12px 24px 0;">
      <input type="search" class="penna-emoji-search" placeholder="搜索表情名称" />
    </label>
    <div class="penna-dialog-form-scroll-area">
      <div class="penna-emoji-grid" role="listbox"></div>
    </div>
  `;

  const tabs = Array.from(
    wrap.querySelectorAll(".penna-emoji-tab"),
  ) as HTMLButtonElement[];
  const search = wrap.querySelector(".penna-emoji-search") as HTMLInputElement;
  const grid = wrap.querySelector(".penna-emoji-grid") as HTMLElement;

  let currentCategory = categories[0];
  let searchQuery = "";

  const renderEmojiButton = (alias: string) => {
    const emoji = (emojiFull as Record<string, string>)[alias];
    if (!emoji) return null;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "penna-emoji-item";
    btn.title = ":" + alias + ":";
    btn.innerHTML = `<span class="penna-emoji-char">${emoji}</span>`;
    btn.addEventListener("click", () =>
      callbacks.onSubmit({ code: `:${alias}:` }),
    );
    return btn;
  };

  const paint = () => {
    grid.replaceChildren();

    if (searchQuery) {
      // 搜索模式
      const q = searchQuery.toLowerCase();
      let count = 0;
      for (const [cat, aliases] of Object.entries(emojiCategories)) {
        for (const alias of aliases) {
          if (alias.includes(q)) {
            const btn = renderEmojiButton(alias);
            if (btn) {
              grid.appendChild(btn);
              count++;
            }
          }
        }
      }
      if (count === 0) {
        grid.innerHTML = '<div class="penna-emoji-empty">无结果</div>';
      }
    } else {
      // 分类模式
      const aliases = emojiCategories[currentCategory] || [];
      for (const alias of aliases) {
        const btn = renderEmojiButton(alias);
        if (btn) grid.appendChild(btn);
      }
    }
  };

  const updateTabs = () => {
    tabs.forEach((tab) => {
      if (tab.dataset.category === currentCategory && !searchQuery) {
        tab.classList.add("active");
      } else {
        tab.classList.remove("active");
      }
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const cat = tab.dataset.category;
      if (cat) {
        currentCategory = cat;
        searchQuery = "";
        search.value = "";
        updateTabs();
        paint();
      }
    });
  });

  search.addEventListener("input", () => {
    searchQuery = search.value.trim();
    updateTabs();
    paint();
  });

  paint();
  host.appendChild(wrap);
  search.focus();
  return () => wrap.remove();
}

/** `emoji` — 打开 Emoji 选择器插入 shortcode（如 `:smile:`）。 */
export class EmojiCommand implements Command, DialogCapableCommand {
  readonly dialogType: DialogType = "emoji";

  renderDialog = renderEmojiDialog;

  /**
   * 打开 Emoji 选择器并插入选中的 shortcode。
   * @param view - 要修改的 CodeMirror 编辑器实例
   * @param _p - 未使用的命令参数
   * @param ctx - 提供事件总线的命令上下文
   * @returns 用户取消、未选择 Emoji 或缺少事件总线时返回 false
   */
  async execute(
    view: EditorView,
    _p: unknown,
    ctx: CommandContext,
  ): Promise<boolean> {
    if (!ctx?.eventBus) return false;
    const data = await requestDialog(ctx.eventBus, "emoji");
    if (!data?.code) return false;
    insertText(view, data.code);
    return true;
  }
}

/** `emoji` 命令实例 */
export const emojiCommand = new EmojiCommand();
