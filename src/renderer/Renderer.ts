import { TransformerEngine } from "@/transformer/TransformerEngine.js";
import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { Theme } from "@/theme/Theme.js";
import { injectHeadingIds } from "./toc/inject.js";
import { extractToc, extractTocFlat } from "./toc/extract.js";
import {replaceGraph} from "@/renderer/graph/graph";
import {CodeListener} from "@/renderer/code/code";
import {TransformerEngineOptions} from "@/transformer/TransformerEngineOptions";
import {HighlightJs} from "@/renderer/highlight/highlight";

export interface RenderOption {
  mount: HTMLElement;
  theme: Theme;
  transformerEngineOptions: TransformerEngineOptions;
}

export class Renderer {
  readonly theme: Theme;
  private readonly mount: HTMLElement;
  private readonly transformer : TransformerEngine;
  private lastAst: MarkdownNode | null = null;
  private codeListener: CodeListener | null = null;
  private highlight: HighlightJs | null = null;

  private readonly onLightDarkChanged = (): void => {
    this.syncDarkFromTheme();
    replaceGraph(this.mount, this.theme.getTheme().isDark);
    this.highlight?.run();
  };

  private readonly onSkinChanged = (): void => {
    this.highlight?.run();
  };

  constructor({ mount, theme , transformerEngineOptions}: RenderOption) {
    if (!mount) {
      throw new Error("渲染器需要 mount 元素");
    }
    if (!theme) {
      throw new Error("渲染器需要 theme 实例");
    }

    this.mount = mount;
    this.theme = theme;
    this.transformer = new TransformerEngine(transformerEngineOptions)

    this.syncDarkFromTheme();

    theme.on("theme:ld", this.onLightDarkChanged);
    theme.on("theme:skin", this.onSkinChanged)


    this.codeListener = new CodeListener(this.mount);
    this.highlight = new HighlightJs(this.mount);
  }

  private syncDarkFromTheme(): void {
    this.transformer.isDark = this.theme.getTheme().isDark;
  }


  render(markdown: string): { html: string; ast: MarkdownNode } {
    this.syncDarkFromTheme();
    const ast = this.transformer.parse(markdown);
    const html = this.transformer.render(ast);
    this.lastAst = ast;

    this.mount.innerHTML = html;

    injectHeadingIds(this.mount);
    this.highlight?.run()
    return { html, ast };
  }

  getToc() {
    return this.lastAst ? extractToc(this.lastAst) : [];
  }

  getTocFlat() {
    return this.lastAst ? extractTocFlat(this.lastAst) : [];
  }

  destroy(): void {
    this.theme.off("theme:ld", this.onLightDarkChanged);
    this.theme.off("theme:skin", this.onSkinChanged)

    this.lastAst = null;
    this.codeListener?.destroy();
  }
}
