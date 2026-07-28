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
import { reconcileDomFull } from "@/renderer/incremental/DomReconciler.js";
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
export type { PennaChangeLineSet };
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
 * 追加 `chunk` 后文档新增的行数。
 *
 * `normalizeMarkdownLines(md).length` 恒等于「md 中的换行数 + (md 以换行结尾 ? 0 : 1)」，
 * 两式相减，公共部分抵消，只需扫描 chunk 而不必重切整篇文档。
 *
 * 出现 `\r` 时退回精确计算：归一化会把 `\r\n` / `\r` 折成 `\n`，
 * 且 chunk 边界可能落在 `\r` 与 `\n` 之间，单独数 chunk 会算错。
 */
function appendedLineCount(oldMd: string, chunk: string): number {
  if (chunk.includes("\r") || oldMd.endsWith("\r")) {
    return (
      normalizeMarkdownLines(`${oldMd}${chunk}`).length -
      normalizeMarkdownLines(oldMd).length
    );
  }

  let newlines = 0;
  for (let i = chunk.indexOf("\n"); i >= 0; i = chunk.indexOf("\n", i + 1)) {
    newlines++;
  }

  return (
    newlines + (chunk.endsWith("\n") ? 0 : 1) - (oldMd.endsWith("\n") ? 0 : 1)
  );
}

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
  /**
   * 最近一次渲染的原始 markdown，供 {@link append} 拼接。
   *
   * 不能用 `session.lines.join("\n")` 还原：归一化会 pop 末尾空串，
   * 文档是否以 `\n` 结尾的信息在 lines 里已经丢失。
   */
  private lastMarkdown = "";
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
    this.lastMarkdown = markdown;

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
    return this.buildResult(
      incremental.ast,
      true,
      incremental.changedStartLines,
    );
  }

  /**
   * 组装 {@link RenderResult}；`html` 惰性求值。
   *
   * `composeHtml` 要序列化整个预览区，代价与文档长度成正比。流式追加时
   * 每个 chunk 都算一次会产生 GB 级临时字符串，而库内无人消费该字段。
   * 读取时才计算，并缓存到本次结果上。
   */
  private buildResult(
    ast: MarkdownNode,
    partial: boolean,
    changedStartLines: number[],
  ): RenderResult {
    const compose = (): string => this.session.composeHtml(this.mount);
    let html: string | null = null;

    return {
      get html(): string {
        html ??= compose();
        return html;
      },
      ast,
      blocks: this.getMountedBlocks(),
      partial,
      changedStartLines,
    };
  }

  /**
   * 在当前文档末尾追加任意字符，等同于编辑器在文档末尾输入字符。
   *
   * - 以 {@link lastMarkdown} 为基准（与 render/renderFull 状态严格同步）
   * - 直接构造追加位置的行变更，完全复用编辑器增量路径
   * - 无缓存时由 {@link render} 退化为 renderFull
   *
   * @param chunk 要追加到文档末尾的字符串（delta，不是累计全文）
   */
  append(chunk: string): RenderResult {
    if (!chunk) {
      return this.session.blocks.length === 0
        ? this.renderFull("")
        : this.buildResult(this.lastAst!, true, []);
    }

    const newMd = `${this.lastMarkdown}${chunk}`;

    // 行数不能重新切整篇文档：流式追加时那是每个 chunk 一次 O(全文) 分配。
    // 旧行数 session.lines 已经有；新行数按 chunk 内的换行推算即可。
    const fromA = this.session.lines.length;
    const toB = fromA + appendedLineCount(this.lastMarkdown, chunk);

    // 追加只影响最后一行（及其后延伸出的新行）。
    // fromA = toA = 旧文档最后一行（1-based），fromB = 同行，toB = 新文档末行。
    return this.render(newMd, [
      {
        fromA,
        toA: fromA,
        fromB: fromA,
        toB,
        deletedLines: 0,
        insertedLines: toB - fromA,
        isFullDocument: false,
      },
    ]);
  }

  /**
   * 全量 parse + DOM reconcile，并接管增量会话快照。
   *
   * 不再 `replaceChildren` 整片重建：全量 parse 保证 store 正确，DOM 层经
   * {@link reconcileDomFull} 按渲染内容复用未变节点，仅替换真正变化的块。
   * 消除 `full-replace` / `global-effect` 降级时整文档 DOM 重建的闪烁与媒体重载。
   *
   * @param markdown 完整 markdown 源码
   */
  renderFull(markdown: string): RenderResult {
    this.lastMarkdown = markdown;
    this.syncDarkFromTheme();
    const lines = normalizeMarkdownLines(markdown);
    const ast = this.transformer.parse(markdown);
    this.lastAst = ast;

    const store = ast.props?.store as ParserStore;
    const ctx = store ? this.transformer.createRenderContext(store) : null;
    const renderPart = (node: MarkdownNode): string =>
      ctx ? this.transformer.renderBlockWithContext(node, ctx) : "";

    const result = reconcileDomFull(
      this.mount,
      ast,
      renderPart,
      this.session.blocks,
    );

    this.session.adoptFullParse(lines, ast, result.blocks);
    this.logger.logD("render:full", "done", {
      blockCount: result.blocks.length,
      replacedCount: result.replacedCount,
    });
    return this.buildResult(ast, false, []);
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
    this.lastMarkdown = "";
    this.session.reset();
    this.codeListener?.destroy();
    this.imageListener?.destroy();
    this.footnoteListener?.destroy();
  }
}
