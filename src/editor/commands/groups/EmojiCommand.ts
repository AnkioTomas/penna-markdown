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

function renderEmojiDialog(
  host: HTMLElement,
  _props: Record<string, unknown>,
  callbacks: DialogCallbacks<EmojiDialogResult>,
): () => void {
  const wrap = document.createElement("div");
  wrap.className = "cherry-dialog-form cherry-dialog-form--emoji";

  const categories = Object.keys(emojiCategories);

  wrap.innerHTML = `
    <div class="cherry-dialog-table-head" style="padding-bottom: 8px;">
      <span class="cherry-dialog-table-title">插入 Emoji</span>
    </div>
    <div class="cherry-emoji-tabs">
      ${categories
        .map(
          (cat) =>
            `<button type="button" class="cherry-emoji-tab ${cat === categories[0] ? "active" : ""}" data-category="${cat}" title="${cat}">${CATEGORY_ICONS[cat] || "✨"}</button>`,
        )
        .join("")}
    </div>
    <label class="cherry-dialog-field" style="padding: 12px 24px 0;">
      <input type="search" class="cherry-emoji-search" placeholder="搜索表情名称" />
    </label>
    <div class="cherry-dialog-form-scroll-area">
      <div class="cherry-emoji-grid" role="listbox"></div>
    </div>
  `;

  const tabs = Array.from(
    wrap.querySelectorAll(".cherry-emoji-tab"),
  ) as HTMLButtonElement[];
  const search = wrap.querySelector(".cherry-emoji-search") as HTMLInputElement;
  const grid = wrap.querySelector(".cherry-emoji-grid") as HTMLElement;

  let currentCategory = categories[0];
  let searchQuery = "";

  const renderEmojiButton = (alias: string) => {
    const emoji = (emojiFull as Record<string, string>)[alias];
    if (!emoji) return null;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cherry-emoji-item";
    btn.title = ":" + alias + ":";
    btn.innerHTML = `<span class="cherry-emoji-char">${emoji}</span>`;
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
        grid.innerHTML = '<div class="cherry-emoji-empty">无结果</div>';
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
