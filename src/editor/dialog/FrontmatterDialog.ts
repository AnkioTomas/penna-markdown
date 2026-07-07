import type { FrontmatterDialogResult } from "@/editor/commands/types.js";

export function validateFrontmatterYaml(yaml: string): string | null {
  const body = yaml.trim();
  if (!body) return "YAML 不能为空";
  const lines = body.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (!line || line.startsWith("#")) continue;
    if (/^[\w.-]+\s*:\s*.+/.test(line)) continue;
    if (/^[\w.-]+\s*:\s*$/.test(line)) continue;
    if (/^-\s+.+/.test(line)) continue;
    return `第 ${i + 1} 行格式无效：${lines[i]}`;
  }
  return null;
}

export function renderFrontmatterDialog(
  host: HTMLElement,
  props: { yaml?: string },
  callbacks: { onSubmit: (d: FrontmatterDialogResult) => void; onCancel: () => void },
): () => void {
  const form = document.createElement("form");
  form.className = "cherry-dialog-form";
  form.innerHTML = `
    <div class="cherry-dialog-table-head">
      <span class="cherry-dialog-table-title">文档头（YAML）</span>
    </div>
    <p class="cherry-dialog-table-hint">插入到文档顶部，替换已有 frontmatter</p>
    <p class="cherry-dialog-yaml-error" hidden></p>
    <label class="cherry-dialog-field">YAML<textarea name="yaml" rows="10" required>title: 标题
description: 描述
author:
  name: 作者
tags: [demo]</textarea></label>
    <div class="cherry-dialog-actions">
      <button type="button" data-action="cancel">取消</button>
      <button type="submit" class="is-primary">插入到顶部</button>
    </div>
  `;
  (form.elements.namedItem("yaml") as HTMLTextAreaElement).value = props.yaml ?? `title: 标题\ndescription: 描述\n`;
  const errEl = form.querySelector(".cherry-dialog-yaml-error") as HTMLElement;
  form.querySelector('[data-action="cancel"]')?.addEventListener("click", () => callbacks.onCancel());
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const yaml = String(new FormData(form).get("yaml") ?? "").trim();
    const err = validateFrontmatterYaml(yaml);
    if (err) {
      errEl.hidden = false;
      errEl.textContent = err;
      return;
    }
    errEl.hidden = true;
    callbacks.onSubmit({ yaml });
  });
  host.appendChild(form);
  return () => form.remove();
}

export function frontmatterMarkdown(yaml: string): string {
  return `---\n${yaml.trim()}\n---\n\n`;
}
