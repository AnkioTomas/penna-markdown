function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** 轻量 JSON 语法高亮（仅用于调试面板展示）。 */
export function highlightJson(data: unknown): string {
  const json = JSON.stringify(data, null, 2);
  const safe = escapeHtml(json);

  return safe
    .replace(
      /^(\s*)("(?:[^"\\]|\\.)*")(\s*:)/gm,
      '$1<span class="jk">$2</span>$3',
    )
    .replace(
      /(:\s*)("(?:[^"\\]|\\.)*")/g,
      '$1<span class="js">$2</span>',
    )
    .replace(
      /(:\s*)(-?\d+\.?\d*)/g,
      '$1<span class="jn">$2</span>',
    )
    .replace(
      /\b(true|false|null)\b/g,
      '<span class="jl">$1</span>',
    );
}
