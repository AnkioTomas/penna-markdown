import { TransformerEngine } from "@/transformer/TransformerEngine.js";
import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { initContainer, setHtml, teardownContainer } from "./container.js";
import { setupCherryCodeHighlight } from "./highlight/setup.js";
import "./interactions/register.js";
import { afterRender, refreshAfterTheme } from "./theme/refresh.js";
import { watchCherryTheme } from "./theme/watch.js";
import { injectHeadingIds } from "./toc/inject.js";
import { extractToc, extractTocFlat } from "./toc/extract.js";
import type { RendererApi, RendererOptions, RenderResult } from "./types.js";

function resolveTransformer(
  factory?: RendererOptions["transformer"],
): TransformerEngine {
  if (typeof factory === "function") return factory();
  return factory ?? new TransformerEngine();
}

/** 创建预览渲染器。 */
export function createRenderer({
  mount,
  transformer: transformerOption,
  watchTheme = true,
  highlight,
  isDark,
}: RendererOptions): RendererApi {
  if (!mount) {
    throw new Error("渲染器需要 mount 元素");
  }

  const transformer = resolveTransformer(transformerOption);
  let lastAst: MarkdownNode | null = null;
  const themeOptions = isDark ? { isDark } : undefined;

  initContainer(mount);
  setupCherryCodeHighlight(highlight);

  let unwatchTheme: (() => void) | null = watchTheme
    ? watchCherryTheme(mount, () => refreshAfterTheme(mount, themeOptions))
    : null;

  return {
    render(markdown: string): RenderResult {
      const ast = transformer.parse(markdown);
      const html = transformer.render(ast);
      lastAst = ast;

      setHtml(mount, html);
      injectHeadingIds(mount);
      afterRender(mount, themeOptions);

      return { html, ast };
    },

    getToc() {
      return lastAst ? extractToc(lastAst) : [];
    },

    getTocFlat() {
      return lastAst ? extractTocFlat(lastAst) : [];
    },

    update(input) {
      setHtml(mount, input.html || "");
      injectHeadingIds(mount);
      afterRender(mount, themeOptions);
    },

    destroy() {
      unwatchTheme?.();
      unwatchTheme = null;
      teardownContainer(mount);
      lastAst = null;
    },
  };
}
