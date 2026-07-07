import type { MediaDialogResult } from "@/editor/commands/types.js";

const KIND_LABELS: Record<MediaDialogResult["kind"], string> = {
  video: "视频",
  audio: "音频",
  iframe: "嵌入页",
};

export function renderMediaDialog(
  host: HTMLElement,
  props: {
    kind?: MediaDialogResult["kind"];
    label?: string;
    url?: string;
    poster?: string;
  },
  callbacks: { onSubmit: (d: MediaDialogResult) => void; onCancel: () => void },
): () => void {
  const kind = props.kind ?? "video";
  const form = document.createElement("form");
  form.className = "cherry-dialog-form";
  form.innerHTML = `
    <div class="cherry-dialog-table-head">
      <span class="cherry-dialog-table-title">插入${KIND_LABELS[kind]}</span>
    </div>
    <label class="cherry-dialog-field">标题<input name="label" type="text" placeholder="显示标题" /></label>
    <label class="cherry-dialog-field">地址<input name="url" type="url" required placeholder="https://..." /></label>
    <label class="cherry-dialog-field">封面（可选）<input name="poster" type="url" placeholder="https://..." /></label>
    <div class="cherry-dialog-actions">
      <button type="button" data-action="cancel">取消</button>
      <button type="submit" class="is-primary">插入</button>
    </div>
  `;
  (form.elements.namedItem("label") as HTMLInputElement).value =
    props.label ?? "";
  (form.elements.namedItem("url") as HTMLInputElement).value = props.url ?? "";
  (form.elements.namedItem("poster") as HTMLInputElement).value =
    props.poster ?? "";
  form
    .querySelector('[data-action="cancel"]')
    ?.addEventListener("click", () => callbacks.onCancel());
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const url = String(fd.get("url") ?? "").trim();
    if (!url) return;
    callbacks.onSubmit({
      kind,
      label: String(fd.get("label") ?? "").trim() || KIND_LABELS[kind],
      url,
      poster: String(fd.get("poster") ?? "").trim() || undefined,
    });
  });
  host.appendChild(form);
  return () => form.remove();
}

export function mediaMarkdown(data: MediaDialogResult): string {
  const label = data.label;
  let md = `!${data.kind}[${label}](${data.url})`;
  if (data.poster) md += `{poster=${data.poster}}`;
  return `${md}\n`;
}
