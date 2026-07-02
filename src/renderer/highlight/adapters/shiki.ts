import { wrapCodeLineHtml } from "@/transformer/extends/block/enhancedCode.js";
import type { CodeHighlightAdapter } from "../setup.js";

export interface ShikiAdapterOptions {
  themes?: string[];
  langs?: string[];
}

export async function loadShikiAdapter(
  options: ShikiAdapterOptions = {},
): Promise<CodeHighlightAdapter> {
  const themes = options.themes ?? ["github-light", "github-dark"];
  const { createHighlighter } = await import("shiki");
  const highlighter = await createHighlighter({
    themes,
    langs: options.langs ?? ["javascript", "json", "bash", "typescript", "css", "html", "markdown"],
  });

  const [lightTheme, darkTheme] = themes;

  return {
    highlight(code, lang, { dark, highlightLines = [] } = {}) {
      const language = lang || "text";
      const loaded = highlighter.getLoadedLanguages().includes(language);
      const targetLang = loaded ? language : "text";
      const theme = dark ? darkTheme : lightTheme;

      if (highlightLines.length > 0) {
        const highlightSet = new Set(highlightLines);
        return code
          .split("\n")
          .map((line, index) => {
            const inner = highlighter.codeToHtml(line, { lang: targetLang, theme });
            const codeInner = inner.replace(/^<pre[^>]*><code[^>]*>/i, "").replace(/<\/code><\/pre>$/i, "");
            return wrapCodeLineHtml(codeInner, index + 1, highlightSet);
          })
          .join("\n");
      }

      return highlighter.codeToHtml(code, {
        lang: targetLang,
        theme,
      });
    },
  };
}
