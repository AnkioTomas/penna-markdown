import type { LinkDialogResult } from "@/editor/commands/types.js";

export function renderLinkDialog(
  host: HTMLElement,
  props: { text?: string; url?: string },
  callbacks: { onSubmit: (d: LinkDialogResult) => void; onCancel: () => void },
): () => void {
  const form = document.createElement("form");
  form.className = "cherry-dialog-form";
  form.innerHTML = `
    <label class="cherry-dialog-field">文本<input name="text" type="text" /></label>
    <label class="cherry-dialog-field">链接<input name="url" type="url" required /></label>
    <label class="cherry-dialog-field">标题（可选）<input name="title" type="text" /></label>
    <div class="cherry-dialog-actions">
      <button type="button" data-action="cancel">取消</button>
      <button type="submit">插入</button>
    </div>
  `;
  (form.elements.namedItem("text") as HTMLInputElement).value =
    props.text ?? "";
  (form.elements.namedItem("url") as HTMLInputElement).value = props.url ?? "";
  form
    .querySelector('[data-action="cancel"]')
    ?.addEventListener("click", () => callbacks.onCancel());
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const url = String(fd.get("url") ?? "").trim();
    if (!url) return;
    callbacks.onSubmit({
      text: String(fd.get("text") ?? "").trim(),
      url,
      title: String(fd.get("title") ?? "").trim() || undefined,
    });
  });
  host.appendChild(form);
  return () => form.remove();
}
