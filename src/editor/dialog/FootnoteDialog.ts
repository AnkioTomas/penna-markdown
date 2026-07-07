import type { FootnoteDialogResult } from "@/editor/commands/types.js";

export function renderFootnoteDialog(
  host: HTMLElement,
  props: { id?: string; mode?: FootnoteDialogResult["mode"] },
  callbacks: {
    onSubmit: (d: FootnoteDialogResult) => void;
    onCancel: () => void;
  },
): () => void {
  const form = document.createElement("form");
  form.className = "cherry-dialog-form";
  const mode = props.mode ?? "both";
  form.innerHTML = `
    <div class="cherry-dialog-table-head">
      <span class="cherry-dialog-table-title">脚注</span>
    </div>
    <label class="cherry-dialog-field">标识<input name="id" type="text" required placeholder="1 或 note" value="${props.id ?? "1"}" /></label>
    <label class="cherry-dialog-field">模式<select name="mode">
      <option value="ref" ${mode === "ref" ? "selected" : ""}>仅引用 [^id]</option>
      <option value="def" ${mode === "def" ? "selected" : ""}>仅定义 [^id]: ...</option>
      <option value="both" ${mode === "both" ? "selected" : ""}>引用 + 定义</option>
    </select></label>
    <label class="cherry-dialog-field">定义内容<textarea name="content" rows="3" placeholder="脚注正文（引用+定义时必填）"></textarea></label>
    <div class="cherry-dialog-actions">
      <button type="button" data-action="cancel">取消</button>
      <button type="submit" class="is-primary">插入</button>
    </div>
  `;
  form
    .querySelector('[data-action="cancel"]')
    ?.addEventListener("click", () => callbacks.onCancel());
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const id = String(fd.get("id") ?? "").trim();
    if (!id) return;
    const m = String(fd.get("mode") ?? "both") as FootnoteDialogResult["mode"];
    const content = String(fd.get("content") ?? "").trim();
    if ((m === "def" || m === "both") && !content) return;
    callbacks.onSubmit({ id, content: content || undefined, mode: m });
  });
  host.appendChild(form);
  return () => form.remove();
}
