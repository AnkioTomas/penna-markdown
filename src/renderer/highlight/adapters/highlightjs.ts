import { highlightCodeByLines } from "@/renderer/utils/highlightByLines.js";
import type { CodeHighlightAdapter } from "../setup.js";

export interface HighlightJsAdapterOptions {
  hljs?: typeof import("highlight.js").default;
  register?: (hljs: typeof import("highlight.js").default) => void | Promise<void>;
}

export async function loadHighlightJsAdapter(
  options: HighlightJsAdapterOptions = {},
): Promise<CodeHighlightAdapter> {
  const hljs = options.hljs ?? (await import("highlight.js")).default;
  if (options.register) await options.register(hljs);

  return {
    highlight(code, lang, ctx = {}) {
      const highlightLines = ctx.highlightLines ?? [];
      if (ctx.panel || ctx.collapse) {
        return highlightCodeByLines(
          hljs,
          code,
          lang,
          highlightLines,
          ctx.panel ?? null,
          ctx.collapse ?? null,
        );
      }
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
      }
      return hljs.highlightAuto(code).value;
    },
  };
}
