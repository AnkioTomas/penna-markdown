import type {
  CodeBlockDialogResult,
  CodeBlockVariant,
} from "@/editor/commands/types.js";

const VARIANT_LABELS: Record<CodeBlockVariant, string> = {
  basic: "基础围栏",
  title: "带文件名",
  highlight: "行号高亮",
  collapse: "折叠长代码",
};

export function renderCodeBlockDialog(
  host: HTMLElement,
  props: { variant?: CodeBlockVariant; code?: string },
  callbacks: {
    onSubmit: (d: CodeBlockDialogResult) => void;
    onCancel: () => void;
  },
): () => void {
  const variant = props.variant ?? "basic";
  const form = document.createElement("form");
  form.className = "cherry-dialog-form";
  form.innerHTML = `
    <div class="cherry-dialog-table-head">
      <span class="cherry-dialog-table-title">${VARIANT_LABELS[variant]}</span>
    </div>
    <label class="cherry-dialog-field">语言<input name="lang" type="text" value="javascript" required /></label>
    <label class="cherry-dialog-field cherry-dialog-field--title" hidden>文件名<input name="title" type="text" placeholder="example.js" /></label>
    <label class="cherry-dialog-field cherry-dialog-field--highlight" hidden>高亮行<input name="highlightLines" type="text" placeholder="2,4-6" /></label>
    <label class="cherry-dialog-field">代码<textarea name="code" rows="8" required placeholder="console.log('hello');">console.log("hello");</textarea></label>
    <div class="cherry-dialog-actions">
      <button type="button" data-action="cancel">取消</button>
      <button type="submit" class="is-primary">插入</button>
    </div>
  `;

  const titleField = form.querySelector(
    ".cherry-dialog-field--title",
  ) as HTMLElement;
  const highlightField = form.querySelector(
    ".cherry-dialog-field--highlight",
  ) as HTMLElement;
  if (props.code) {
    (form.elements.namedItem("code") as HTMLTextAreaElement).value = String(
      props.code,
    );
  }
  titleField.hidden = variant !== "title";
  highlightField.hidden = variant !== "highlight";
  form
    .querySelector('[data-action="cancel"]')
    ?.addEventListener("click", () => callbacks.onCancel());
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const lang = String(fd.get("lang") ?? "").trim() || "text";
    const code = String(fd.get("code") ?? "");
    if (!code.trim()) return;
    callbacks.onSubmit({
      variant,
      lang,
      code,
      title: String(fd.get("title") ?? "").trim() || undefined,
      highlightLines:
        String(fd.get("highlightLines") ?? "").trim() || undefined,
    });
  });
  host.appendChild(form);
  return () => form.remove();
}

export function codeBlockMarkdown(data: CodeBlockDialogResult): string {
  const { lang, code } = data;
  if (data.variant === "title" && data.title) {
    return `\`\`\`${lang} title="${data.title}"\n${code}\n\`\`\`\n`;
  }
  if (data.variant === "highlight" && data.highlightLines) {
    return `\`\`\`${lang}{${data.highlightLines}}\n${code}\n\`\`\`\n`;
  }
  if (data.variant === "collapse") {
    return `\`\`\`${lang} :collapsed-lines\n${code}\n\`\`\`\n`;
  }
  return `\`\`\`${lang}\n${code}\n\`\`\`\n`;
}
