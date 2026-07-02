/**
 * @file 渲染器入口
 * @module renderer/index
 *
 * Transformer 的 UI 容器：挂载 HTML、交互委托、代码高亮、TOC。
 */

export { createRenderer } from "./Renderer.js";
export type {
  RendererApi,
  RendererOptions,
  RenderResult,
  TocFlatItem,
  TocItem,
} from "./types.js";

export { extractToc, extractTocFlat } from "./toc/extract.js";
export { extractHeadingText } from "./toc/text.js";
export { slugify, assignSlug } from "./toc/slug.js";
export { injectHeadingIds } from "./toc/inject.js";

export {
  setupCherryCodeHighlight,
  type CodeHighlightAdapter,
  type CodeHighlightContext,
  type CodeHighlightSetup,
} from "./highlight/setup.js";
export { loadHighlightJsAdapter } from "./highlight/adapters/highlightjs.js";
export {
  DEFAULT_HIGHLIGHT_JS_CDN,
  DEFAULT_HIGHLIGHT_JS_CSS,
  loadHighlightJsFromCdn,
} from "./highlight/adapters/highlightjsCdn.js";
export { loadShikiAdapter } from "./highlight/adapters/shiki.js";

export { isDark } from "./theme/isDark.js";
export { watchCherryTheme } from "./theme/watch.js";

export {
  CHERRY_PREVIEW_CLASS,
  ensurePreviewDelegation,
  findCherryPreview,
  registerPreviewClickDelegation,
  releasePreviewDelegation,
} from "./delegate.js";
export { loadScript, loadStylesheet } from "./utils/loadScript.js";
