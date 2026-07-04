import { escapeHtml } from "@/transformer/utils/escape.js";

/** 渲染代码块内部 HTML：有 highlightJs 时内联高亮，否则转义纯文本。 */
export function renderCodeInnerHtml(
  content: string,
  lang: string,
  options: Record<string, unknown>,
): string {
  const highlightJs = options.highlightJs as
    | { highlightCodeHtml(code: string, lang: string): string }
    | undefined;
  if (highlightJs && content) {
    return highlightJs.highlightCodeHtml(content, lang);
  }
  const suffix = content === "" ? "" : "\n";
  return `${escapeHtml(content)}${suffix}`;
}
