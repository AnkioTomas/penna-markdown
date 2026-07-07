import type { TimelineDialogResult } from "@/editor/commands/types.js";

export function renderTimelineDialog(
  host: HTMLElement,
  props: Partial<TimelineDialogResult>,
  callbacks: {
    onSubmit: (d: TimelineDialogResult) => void;
    onCancel: () => void;
  },
): () => void {
  const form = document.createElement("form");
  form.className = "cherry-dialog-form";
  form.innerHTML = `
    <div class="cherry-dialog-table-head">
      <span class="cherry-dialog-table-title">时间线节点</span>
    </div>
    <label class="cherry-dialog-field">里程碑<input name="title" type="text" required value="${props.title ?? "里程碑"}" /></label>
    <label class="cherry-dialog-field">时间<input name="time" type="text" value="${props.time ?? "2024-01"}" placeholder="2024-01" /></label>
    <label class="cherry-dialog-field">类型<select name="type">
      <option value="success">成功</option>
      <option value="important">重要</option>
      <option value="warning">警告</option>
      <option value="default">默认</option>
    </select></label>
    <label class="cherry-dialog-field">连线<select name="lineStyle">
      <option value="">实线</option>
      <option value="dotted">点线</option>
      <option value="dashed">虚线</option>
    </select></label>
    <label class="cherry-dialog-field">说明<textarea name="content" rows="3">${props.content ?? "事件说明"}</textarea></label>
    <div class="cherry-dialog-actions">
      <button type="button" data-action="cancel">取消</button>
      <button type="submit" class="is-primary">插入</button>
    </div>
  `;
  if (props.type)
    (form.elements.namedItem("type") as HTMLSelectElement).value = props.type;
  if (props.lineStyle)
    (form.elements.namedItem("lineStyle") as HTMLSelectElement).value =
      props.lineStyle;
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
      time: String(fd.get("time") ?? "").trim(),
      type: String(fd.get("type") ?? "success"),
      lineStyle: String(fd.get("lineStyle") ?? ""),
      content: String(fd.get("content") ?? "").trim() || "事件说明",
    });
  });
  host.appendChild(form);
  return () => form.remove();
}

export function timelineMarkdown(
  data: TimelineDialogResult,
  containerLine = "",
): string {
  const attrs = [
    `time=${data.time}`,
    data.type ? `type=${data.type}` : "",
    data.lineStyle ? `line=${data.lineStyle}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const open = containerLine ? `::: timeline ${containerLine}` : "::: timeline";
  return `${open}\n- ${data.title}\n  ${attrs}\n\n  ${data.content}\n:::\n`;
}
