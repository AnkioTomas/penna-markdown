import type { AttrDialogResult } from "@/editor/commands/types.js";

export function renderAttrDialog(
  host: HTMLElement,
  props: { value?: string },
  callbacks: { onSubmit: (d: AttrDialogResult) => void; onCancel: () => void },
): () => void {
  const form = document.createElement("form");
  form.className = "cherry-dialog-form";
  form.innerHTML = `
    <div class="cherry-dialog-table-head">
      <span class="cherry-dialog-table-title">HTML 属性</span>
    </div>
    <p class="cherry-dialog-table-hint">追加在选中文本之后，如 .highlight、#id、class="x"</p>
    <label class="cherry-dialog-field">属性<input name="attr" type="text" required placeholder=".highlight 或 #special" /></label>
    <div class="cherry-dialog-actions">
      <button type="button" data-action="cancel">取消</button>
      <button type="submit" class="is-primary">追加</button>
    </div>
  `;
  (form.elements.namedItem("attr") as HTMLInputElement).value =
    props.value ?? ".highlight";
  form
    .querySelector('[data-action="cancel"]')
    ?.addEventListener("click", () => callbacks.onCancel());
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const attr = String(new FormData(form).get("attr") ?? "").trim();
    if (!attr) return;
    callbacks.onSubmit({ attr });
  });
  host.appendChild(form);
  return () => form.remove();
}
