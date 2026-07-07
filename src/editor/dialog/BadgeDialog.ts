import type { BadgeDialogResult, BadgeVariant } from "@/editor/commands/types.js";

const VARIANTS: BadgeVariant[] = [
  "note", "tip", "important", "warning", "caution", "danger",
];

export function renderBadgeDialog(
  host: HTMLElement,
  callbacks: { onSubmit: (d: BadgeDialogResult) => void; onCancel: () => void },
): () => void {
  const form = document.createElement("form");
  form.className = "cherry-dialog-form";
  const variantOptions = VARIANTS.map((v) => `<option value="${v}">${v}</option>`).join("");
  form.innerHTML = `
    <label class="cherry-dialog-field">文本<input name="text" type="text" required /></label>
    <label class="cherry-dialog-field">样式<select name="variant">${variantOptions}</select></label>
    <label class="cherry-dialog-field">位置<select name="position">
      <option value="middle">middle</option>
      <option value="top">top</option>
      <option value="bottom">bottom</option>
    </select></label>
    <div class="cherry-dialog-actions">
      <button type="button" data-action="cancel">取消</button>
      <button type="submit">插入</button>
    </div>
  `;
  form.querySelector('[data-action="cancel"]')?.addEventListener("click", () => callbacks.onCancel());
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const text = String(fd.get("text") ?? "").trim();
    if (!text) return;
    const position = String(fd.get("position") ?? "middle") as BadgeDialogResult["position"];
    callbacks.onSubmit({
      text,
      variant: String(fd.get("variant") ?? "note") as BadgeVariant,
      position: position === "middle" ? undefined : position,
    });
  });
  host.appendChild(form);
  return () => form.remove();
}
