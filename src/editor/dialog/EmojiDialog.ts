import type { EmojiDialogResult } from "@/editor/commands/types.js";

const EMOJI_LIST: { code: string; label: string }[] = [
  { code: ":smile:", label: "微笑" },
  { code: ":grin:", label: "露齿笑" },
  { code: ":heart:", label: "爱心" },
  { code: ":rocket:", label: "火箭" },
  { code: ":warning:", label: "警告" },
  { code: ":bulb:", label: "灯泡" },
  { code: ":+1:", label: "赞" },
  { code: ":thumbsdown:", label: "踩" },
  { code: ":fire:", label: "火焰" },
  { code: ":star:", label: "星星" },
  { code: ":check:", label: "勾选" },
  { code: ":x:", label: "叉号" },
  { code: ":question:", label: "疑问" },
  { code: ":memo:", label: "备忘" },
  { code: ":book:", label: "书籍" },
  { code: ":link:", label: "链接" },
  { code: ":computer:", label: "电脑" },
  { code: ":coffee:", label: "咖啡" },
  { code: ":tada:", label: "庆祝" },
  { code: ":100:", label: "满分" },
];

export function renderEmojiDialog(
  host: HTMLElement,
  callbacks: { onSubmit: (d: EmojiDialogResult) => void; onCancel: () => void },
): () => void {
  const wrap = document.createElement("div");
  wrap.className = "cherry-dialog-form cherry-dialog-form--emoji";
  wrap.innerHTML = `
    <div class="cherry-dialog-table-head">
      <span class="cherry-dialog-table-title">插入 Emoji</span>
    </div>
    <label class="cherry-dialog-field">搜索<input type="search" class="cherry-emoji-search" placeholder="输入名称或 :code:" /></label>
    <div class="cherry-emoji-grid" role="listbox"></div>
    <label class="cherry-dialog-field">自定义代码<input type="text" class="cherry-emoji-custom" placeholder=":smile:" /></label>
    <div class="cherry-dialog-actions">
      <button type="button" data-action="cancel">取消</button>
      <button type="button" data-action="custom" class="is-primary">插入自定义</button>
    </div>
  `;

  const grid = wrap.querySelector(".cherry-emoji-grid") as HTMLElement;
  const search = wrap.querySelector(".cherry-emoji-search") as HTMLInputElement;
  const custom = wrap.querySelector(".cherry-emoji-custom") as HTMLInputElement;

  const paint = (query = "") => {
    const q = query.trim().toLowerCase();
    grid.replaceChildren();
    for (const item of EMOJI_LIST) {
      if (q && !item.code.includes(q) && !item.label.includes(q)) continue;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cherry-emoji-item";
      btn.title = item.code;
      btn.innerHTML = `<span class="cherry-emoji-item-code">${item.code}</span><span class="cherry-emoji-item-label">${item.label}</span>`;
      btn.addEventListener("click", () => callbacks.onSubmit({ code: item.code }));
      grid.appendChild(btn);
    }
  };

  paint();
  search.addEventListener("input", () => paint(search.value));
  wrap.querySelector('[data-action="cancel"]')?.addEventListener("click", () => callbacks.onCancel());
  wrap.querySelector('[data-action="custom"]')?.addEventListener("click", () => {
    const code = custom.value.trim() || search.value.trim();
    if (!code) return;
    callbacks.onSubmit({ code: code.startsWith(":") ? code : `:${code}:` });
  });

  host.appendChild(wrap);
  search.focus();
  return () => wrap.remove();
}
