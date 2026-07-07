import type { CollapseDialogResult } from "@/editor/commands/types.js";

export function renderCollapseDialog(
  host: HTMLElement,
  callbacks: {
    onSubmit: (d: CollapseDialogResult) => void;
    onCancel: () => void;
  },
): () => void {
  const form = document.createElement("form");
  form.className = "cherry-dialog-form";
  form.innerHTML = `
    <div class="cherry-dialog-table-head">
      <span class="cherry-dialog-table-title">折叠面板</span>
    </div>
    <label class="cherry-dialog-field">面板标题<input name="title" type="text" required value="面板标题" /></label>
    <label class="cherry-dialog-field">面板内容<textarea name="content" rows="4">面板内容</textarea></label>
    <label class="cherry-dialog-field"><input name="accordion" type="checkbox" checked /> 手风琴模式</label>
    <label class="cherry-dialog-field"><input name="expanded" type="checkbox" /> 默认展开（标题前加 :+）</label>
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
    const title = String(fd.get("title") ?? "").trim();
    if (!title) return;
    callbacks.onSubmit({
      title,
      content: String(fd.get("content") ?? "").trim() || "面板内容",
      accordion: fd.get("accordion") === "on",
      expanded: fd.get("expanded") === "on",
    });
  });
  host.appendChild(form);
  return () => form.remove();
}

export function collapseMarkdown(data: CollapseDialogResult): string {
  const mode = data.accordion ? "accordion" : "";
  const head = mode ? `::: collapse ${mode}` : "::: collapse";
  const panelTitle = data.expanded ? `:+ ${data.title}` : data.title;
  return `${head}\n- ${panelTitle}\n\n  ${data.content.replace(/\n/g, "\n  ")}\n:::\n`;
}
