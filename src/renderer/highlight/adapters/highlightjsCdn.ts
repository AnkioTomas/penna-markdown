import { loadHighlightJsAdapter } from "./highlightjs.js";
import { loadScript, loadStylesheet } from "@/renderer/utils/loadScript.js";
import type { CodeHighlightAdapter } from "../setup.js";

export const DEFAULT_HIGHLIGHT_JS_CDN =
  "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.11.1/build/highlight.min.js";

export const DEFAULT_HIGHLIGHT_JS_CSS =
  "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.11.1/build/styles/github.min.css";

function readGlobalHljs(win: Window): typeof import("highlight.js").default | undefined {
  return (win as Window & { hljs?: typeof import("highlight.js").default }).hljs;
}

export interface HighlightJsCdnOptions {
  cdn?: string;
  css?: string | boolean;
  hljs?: typeof import("highlight.js").default;
  register?: (hljs: typeof import("highlight.js").default) => void | Promise<void>;
}

export async function loadHighlightJsFromCdn(
  options: HighlightJsCdnOptions = {},
): Promise<CodeHighlightAdapter> {
  const scriptUrl = options.cdn ?? DEFAULT_HIGHLIGHT_JS_CDN;
  const cssOption = options.css;

  if (cssOption !== undefined && cssOption !== false) {
    await loadStylesheet(cssOption === true ? DEFAULT_HIGHLIGHT_JS_CSS : cssOption);
  }

  let hljs = options.hljs;
  if (!hljs && typeof window !== "undefined") {
    hljs = readGlobalHljs(window);
  }

  if (!hljs) {
    await loadScript(scriptUrl);
    if (typeof window !== "undefined") {
      hljs = readGlobalHljs(window);
    }
  }

  if (!hljs) {
    throw new Error("highlight.js CDN 加载失败：未找到全局 hljs");
  }

  return loadHighlightJsAdapter({ hljs, register: options.register });
}
