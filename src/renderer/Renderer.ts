/**
 * @file Markdown 预览渲染器
 * @module renderer/Renderer
 *
 * 将 markdown 解析为 AST 并挂载到 DOM；支持全量与增量两条路径。
 *
 * ## 渲染流程
 *
 * ```
 * markdown
 *    ↓
 * TransformerEngine.parse / parseIncremental
 *    ↓
 * BlockIndex.mountFromAstWithContext 或 DomReconciler.reconcileDom
 *    ↓
 * mount（预览区 DOM）
 * ```
 *
 * 增量会话见 {@link IncrementalSession}；无 cache 或增量失败时降级 {@link renderFull}。
 *
 * 另订阅 {@link THEME_EVENT_LIGHT_DARK}，同步 `transformer.isDark` 并重绘图表主题。
 */

import { TransformerEngine } from "@/transformer/TransformerEngine.js";
import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import { extractToc, extractTocFlat } from "@/renderer/toc/extract";
import { replaceGraph } from "@/renderer/graph/graph";
import { CodeListener } from "@/renderer/code/code";
import { ImageListener } from "@/renderer/image/image";
import { FootnoteListener } from "@/renderer/footnote/footnote";
import hljs from "highlight.js/lib/common";
import type { RenderOption } from "@/renderer/RenderOption";
import { IncrementalSession } from "@/renderer/incremental/IncrementalSession.js";
import { BlockIndex } from "@/renderer/incremental/BlockIndex.js";
import { normalizeMarkdownLines } from "@/transformer/utils/markdownLines.js";
import type { PennaChangeLineSet } from "@/renderer/incremental/PennaChangeSet";
import type { RenderContext } from "@/transformer/core/context/RenderContext.js";
import { ParserStore } from "@/transformer/core/ParserStore";
import { Theme } from "@/theme/Theme";
import type { RenderResult } from "@/renderer/RenderResult";
import { EventBus } from "@/core/event/EventBus";
import { Log } from "@/core/Log";
import { THEME_EVENT_LIGHT_DARK } from "@/theme/event/ThemeLightDarkEvent";

/** 独立使用 Renderer 时需要的 options / 依赖类 / 扩展基类 */
export type { RenderOption } from "@/renderer/RenderOption";
export type { RenderResult } from "@/renderer/RenderResult";
export type { PennaChangeLineSet } from "@/renderer/incremental/PennaChangeSet";
export { Theme, EventBus, Log, THEME_EVENT_LIGHT_DARK };
export type { LightDark } from "@/theme/event/ThemeLightDarkEvent";
export { THEME_EVENT_SKIN } from "@/theme/event/ThemeSkinEvent";
export {
  BaseInlineParser,
  BaseBlockParser,
} from "@/transformer/core/ParserBase";
export type {
  SyntaxOptions,
  InlineParseResult,
  BlockParseResult,
} from "@/transformer/core/ParserBase";
export { createNode } from "@/transformer/core/MarkdownNode";
export type { MarkdownNode } from "@/transformer/core/MarkdownNode";

/**
 * Markdown 预览渲染器。
 *
 * 持有 {@link TransformerEngine} 与 {@link IncrementalSession}，
 * 对外暴露 `render` / `renderFull` 及 TOC、块索引查询。
 */
export class Renderer {
  private readonly theme: Theme;
  private readonly mount: HTMLElement;
  private readonly eventBus: EventBus;
  private readonly logger: Log;
  private readonly transformer: TransformerEngine;
  /** 增量渲染会话；`blocks` 与 `mount.children` 一一对应 */
  private readonly session = new IncrementalSession();
  /** 最近一次成功渲染的 AST 根，供 TOC / ParserStore 查询 */
  private lastAst: MarkdownNode | null = null;
  /** 代码块复制按钮等客户端增强 */
  private codeListener: CodeListener | null = null;
  /** 预览区图片 / SVG 点击放大 */
  private imageListener: ImageListener | null = null;
  /** 脚注悬停提示 */
  private footnoteListener: FootnoteListener | null = null;

  /**
   * @param options 挂载点、主题、事件总线、日志及可选解析器扩展
   */
  constructor(options: RenderOption) {
    this.mount = options.mount;
    this.eventBus = options.eventBus;
    this.logger = options.logger;
    this.theme = options.theme;
    this.transformer = new TransformerEngine({
      inlineParsers: options.inlineParsers,
      blockParsers: options.blockParsers,
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
      isDark: this.theme.getTheme().isDark,
    });

    this.syncDarkFromTheme();

    this.eventBus.on(THEME_EVENT_LIGHT_DARK, this.onLightDarkChanged);

    this.codeListener = new CodeListener(this.mount);
    this.imageListener = new ImageListener(this.mount);
    this.footnoteListener = new FootnoteListener(this.mount);
  }

  /** 明暗切换：同步 transformer 并重绘 Mermaid/ECharts 等图表 */
  private readonly onLightDarkChanged = ({ isDark }): void => {
    this.syncDarkFromTheme();
    replaceGraph(this.mount, isDark);
  };

  /**
   * highlight.js 回调，注入围栏代码块高亮 HTML。
   *
   * @param code 源码
   * @param lang 语言标识；未知时走自动检测
   */
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

  /** 将 {@link Theme} 当前明暗写入 `transformer.isDark` */
  private syncDarkFromTheme(): void {
    this.transformer.isDark = this.theme.getTheme().isDark;
  }

  /**
   * 渲染入口：有增量 cache 时尝试局部更新，否则或失败时全量渲染。
   *
   * @param markdown 完整 markdown 源码
   * @param changes  CM 行变更集；增量路径必需
   */
  render(markdown: string, changes?: PennaChangeLineSet[]): RenderResult {
    if (this.session.blocks.length === 0) {
      this.logger.logD("render:full", "no-cache");
      return this.renderFull(markdown);
    }

    this.logger.logD("render:incremental", "try", { hasChanges: !!changes });

    const incremental = this.session.tryUpdate(
      this.mount,
      markdown,
      this.transformer,
      this.logger,
      changes,
    );

    if (!incremental.ok) {
      this.logger.logD("render:full", incremental.failReason ?? "fallback");
      return this.renderFull(markdown);
    }

    this.lastAst = incremental.ast;
    this.logger.logD("render:incremental", "done", {
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

  /**
   * 全量 parse + DOM 挂载，并接管增量会话快照。
   *
   * @param markdown 完整 markdown 源码
   */
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
    this.logger.logD("render:full", "done", {
      blockCount: mountedBlocks.length,
    });
    return { html, ast, blocks: this.getMountedBlocks(), partial: false };
  }

  /** 当前挂载块索引，顺序与 `mount.children` 一致 */
  getMountedBlocks(): BlockIndex[] {
    return this.session.blocks;
  }

  private createRenderContextFromLastAst(): RenderContext | null {
    const store = this.getStore();
    return store ? this.transformer.createRenderContext(store) : null;
  }

  /** 从最近 AST 提取层级 TOC；无 AST 时返回空数组 */
  getToc() {
    const ctx = this.createRenderContextFromLastAst();
    return this.lastAst && ctx ? extractToc(this.lastAst, ctx) : [];
  }

  /** 从最近 AST 提取扁平 TOC；无 AST 时返回空数组 */
  getTocFlat() {
    const ctx = this.createRenderContextFromLastAst();
    return this.lastAst && ctx ? extractTocFlat(this.lastAst, ctx) : [];
  }

  /** 预览区挂载点 */
  getMount(): HTMLElement {
    return this.mount;
  }

  /** 最近 AST 附带的 {@link ParserStore}；无 AST 或 store 时返回 `null` */
  getStore(): ParserStore | null {
    return (this.lastAst?.props?.store as ParserStore) ?? null;
  }

  /** 注销事件监听、清空会话与代码块增强 */
  destroy(): void {
    this.eventBus.off(THEME_EVENT_LIGHT_DARK, this.onLightDarkChanged);

    this.lastAst = null;
    this.session.reset();
    this.codeListener?.destroy();
    this.imageListener?.destroy();
    this.footnoteListener?.destroy();
  }
}
