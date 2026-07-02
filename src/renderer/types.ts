import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import type { TransformerEngine } from "@/transformer/TransformerEngine.js";
import type { CodeHighlightSetup } from "./highlight/setup.js";

export interface TocItem {
  level: number;
  text: string;
  id: string;
  children: TocItem[];
}

export interface TocFlatItem {
  level: number;
  text: string;
  id: string;
}

export interface RenderResult {
  html: string;
  ast: MarkdownNode;
}

export interface RendererOptions {
  mount: HTMLElement;
  transformer?: TransformerEngine | (() => TransformerEngine);
  watchTheme?: boolean;
  highlight?: CodeHighlightSetup | null;
  /** 由外部决定明暗主题；未提供时按亮色处理。 */
  isDark?: (container: ParentNode) => boolean;
}

export interface RendererApi {
  render(markdown: string): RenderResult;
  getToc(): TocItem[];
  getTocFlat(): TocFlatItem[];
  /** @deprecated 使用 render(markdown) */
  update(input: { html: string }): void;
  destroy(): void;
}
