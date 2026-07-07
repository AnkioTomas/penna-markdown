import { TransformerEngine } from "@/transformer/TransformerEngine.js";
import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import {
  Theme,
  THEME_EVENT_LIGHT_DARK,
  THEME_EVENT_SKIN,
  type ThemeLightDarkEvent,
  type ThemeSkinEvent,
  type LightDark,
} from "@/theme/Theme.js";
export {
  Theme,
  THEME_EVENT_LIGHT_DARK,
  THEME_EVENT_SKIN,
  type ThemeLightDarkEvent,
  type ThemeSkinEvent,
  type LightDark,
};
import { extractToc, extractTocFlat } from "./toc/extract.js";
import { replaceGraph } from "@/renderer/graph/graph";
import { CodeListener } from "@/renderer/code/code";
import hljs from "highlight.js";
import { RenderOption } from "@/renderer/RenderOption";
import { IncrementalSession } from "@/renderer/incremental/IncrementalSession.js";
import { BlockIndex } from "@/renderer/incremental/BlockIndex.js";
import { normalizeMarkdownLines } from "@/transformer/utils/markdownLines.js";
import type { CherryChangeLineSet } from "@/renderer/incremental/CherryChangeSet";
import { ParserStore } from "@/transformer/core/ParserStore";

export interface RenderResult {
  html: string;
  ast: MarkdownNode;
  blocks: BlockIndex[];
  partial?: boolean;
  changedStartLines?: number[];
}

export class Renderer {
  readonly theme: Theme;
  private readonly mount: HTMLElement;
  private readonly transformer: TransformerEngine;
  private readonly session = new IncrementalSession();
  private lastAst: MarkdownNode | null = null;
  private codeListener: CodeListener | null = null;

  private readonly onLightDarkChanged = ({
    isDark,
  }: ThemeLightDarkEvent): void => {
    this.transformer.isDark = isDark;
    replaceGraph(this.mount, isDark);
  };

  constructor({
    mount,
    theme,
    inlineParsers = {},
    blockParsers = {},
  }: RenderOption) {
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
      return hljs.highlight(code, { language: lang, ignoreIllegals: true })
        .value;
    }
    if (code) {
      return hljs.highlightAuto(code).value;
    }
    return "";
  }

  private syncDarkFromTheme(): void {
    this.transformer.isDark = this.theme.getTheme().isDark;
  }

  render(markdown: string, changes?: CherryChangeLineSet[]): RenderResult {
    if (this.session.blocks.length === 0) {
      this.theme.logD("render:full", "no-cache");
      return this.renderFull(markdown);
    }

    this.theme.logD("render:incremental", "try", { hasChanges: !!changes });

    const incremental = this.session.tryUpdate(
      this.mount,
      markdown,
      this.transformer,
      this.theme,
      changes,
    );

    if (!incremental.ok) {
      this.theme.logD("render:full", incremental.failReason ?? "fallback");
      return this.renderFull(markdown);
    }

    this.lastAst = incremental.ast;
    this.theme.logD("render:incremental", "done", {
      changedStartLines: incremental.changedStartLines,
    });
    return {
      html: incremental.html,
      ast: incremental.ast,
      blocks: this.getMountedBlocks(),
      partial: true,
      changedStartLines: incremental.changedStartLines,
    };
  }

  renderFull(markdown: string): RenderResult {
    this.syncDarkFromTheme();
    const lines = normalizeMarkdownLines(markdown);
    const ast = this.transformer.parse(markdown);

    this.lastAst = ast;
    this.mount.replaceChildren();

    const store = ast.props?.store as ParserStore;
    const ctx = store ? this.transformer.createRenderContext(store) : null;
    const { html, mountedBlocks } = BlockIndex.mountFromAstWithContext(
      ast,
      this.mount.ownerDocument,
      this.mount,
      (node) => (ctx ? this.transformer.renderBlockWithContext(node, ctx) : ""),
    );

    this.session.adoptFullParse(lines, ast, mountedBlocks);
    this.theme.logD("render:full", "done", {
      blockCount: mountedBlocks.length,
    });
    return { html, ast, blocks: this.getMountedBlocks(), partial: false };
  }

  getMountedBlocks(): BlockIndex[] {
    return this.session.blocks;
  }

  getToc() {
    return this.lastAst ? extractToc(this.lastAst) : [];
  }

  getTocFlat() {
    return this.lastAst ? extractTocFlat(this.lastAst) : [];
  }

  getMount(): HTMLElement {
    return this.mount;
  }

  destroy(): void {
    this.theme.off(THEME_EVENT_LIGHT_DARK, this.onLightDarkChanged);

    this.lastAst = null;
    this.session.reset();
    this.codeListener?.destroy();
  }
}
