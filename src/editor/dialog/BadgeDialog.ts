import type { BadgeVariant, BadgePosition } from "@/editor/commands/types.js";

const VARIANT_LABELS: Record<BadgeVariant, string> = {
  note: "说明",
  tip: "提示",
  important: "重要",
  warning: "警告",
  caution: "谨慎",
  danger: "危险",
};

const POSITION_LABELS: Record<BadgePosition, string> = {
  middle: "默认",
  top: "顶部",
  bottom: "底部",
};

export function renderBadgeDialog(
  host: HTMLElement,
  callbacks: { onSubmit: (d: import("@/editor/commands/types.js").BadgeDialogResult) => void; onCancel: () => void },
): () => void {
  const form = document.createElement("form");
  form.className = "cherry-dialog-form";
  const variantOptions = (Object.keys(VARIANT_LABELS) as BadgeVariant[])
    .map((v) => `<option value="${v}">${VARIANT_LABELS[v]}</option>`)
    .join("");
  const positionOptions = (Object.keys(POSITION_LABELS) as BadgePosition[])
    .map((p) => `<option value="${p}">${POSITION_LABELS[p]}</option>`)
    .join("");
  form.innerHTML = `
    <div class="cherry-dialog-table-head">
      <span class="cherry-dialog-table-title">插入徽章</span>
    </div>
    <label class="cherry-dialog-field">文本<input name="text" type="text" required placeholder="徽章文字" /></label>
    <label class="cherry-dialog-field">样式<select name="variant">${variantOptions}</select></label>
    <label class="cherry-dialog-field">位置<select name="position">${positionOptions}</select></label>
    <div class="cherry-dialog-actions">
      <button type="button" data-action="cancel">取消</button>
      <button type="submit" class="is-primary">插入</button>
    </div>
  `;
  form.querySelector('[data-action="cancel"]')?.addEventListener("click", () => callbacks.onCancel());
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const text = String(fd.get("text") ?? "").trim();
    if (!text) return;
    const position = String(fd.get("position") ?? "middle") as BadgePosition;
    callbacks.onSubmit({
      text,
      variant: String(fd.get("variant") ?? "note") as BadgeVariant,
      position: position === "middle" ? undefined : position,
    });
  });
  host.appendChild(form);
  return () => form.remove();
}
