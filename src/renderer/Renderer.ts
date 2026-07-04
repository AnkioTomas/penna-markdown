import { TransformerEngine } from "@/transformer/TransformerEngine.js";
import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { Theme, THEME_EVENT_LIGHT_DARK, type ThemeLightDarkEvent } from "@/theme/Theme.js";
import { extractToc, extractTocFlat } from "./toc/extract.js";
import { replaceGraph } from "@/renderer/graph/graph";
import { CodeListener } from "@/renderer/code/code";
import hljs from "highlight.js";
import { RenderOption } from "@/renderer/RenderOption";

export class Renderer {
  readonly theme: Theme;
  private readonly mount: HTMLElement;
  private readonly transformer: TransformerEngine;
  private lastAst: MarkdownNode | null = null;
  private codeListener: CodeListener | null = null;

  private readonly onLightDarkChanged = ({ isDark }: ThemeLightDarkEvent): void => {
    this.transformer.isDark = isDark;
    replaceGraph(this.mount, isDark);
  };

  constructor({ mount, theme, inlineParsers = {}, blockParsers = {} }: RenderOption) {
    if (!mount) {
      throw new Error("渲染器需要 mount 元素");
    }
    if (!theme) {
      throw new Error("渲染器需要 theme 实例");
    }

    this.mount = mount;
    this.theme = theme;
    this.transformer = new TransformerEngine({
      inlineParsers,
      blockParsers,
      syntaxOptions: {
        atx_heading: { slug: true },
        code: {
          enable: true,
          highlightJs: this.highlightCodeHtml,
        },
      },
      renderOptions: {
        sourceLineMap: true,
      },
      isDark: theme.getTheme().isDark,
    });

    this.syncDarkFromTheme();

    theme.on(THEME_EVENT_LIGHT_DARK, this.onLightDarkChanged);

    this.codeListener = new CodeListener(this.mount);
  }

  private highlightCodeHtml(code: string, lang: string): string {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
    }
    if (code) {
      return hljs.highlightAuto(code).value;
    }
    return "";
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
    return { html, ast };
  }

  getToc() {
    return this.lastAst ? extractToc(this.lastAst) : [];
  }

  getTocFlat() {
    return this.lastAst ? extractTocFlat(this.lastAst) : [];
  }

  destroy(): void {
    this.theme.off(THEME_EVENT_LIGHT_DARK, this.onLightDarkChanged);

    this.lastAst = null;
    this.codeListener?.destroy();
  }
}
