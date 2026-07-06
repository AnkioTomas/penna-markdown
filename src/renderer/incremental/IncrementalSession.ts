/**
 * @file 增量渲染会话
 * @module renderer/incremental/IncrementalSession
 *
 * 持有上次渲染的三态快照：`lines` + `ast` + `blocks`。
 * `blocks` 与 `mount.children` 一一对应，供 scroll-sync 消费。
 *
 * ## 模块协作
 *
 * ```
 * CherryChangeLineSet (CM)
 *        ↓
 * HashBoundaryResolver.parseWithHashBoundary  →  局部更新 AST
 *        ↓
 * DomReconciler.reconcileDom                 →  hash 对齐 DOM + 刷新 BlockIndex
 * ```
 *
 * 无 cache、无 changes、任一步失败时返回 `ok: false`，
 * 由 {@link Renderer} 降级全量渲染。
 */

import type { MarkdownNode } from "@/transformer/core/MarkdownNode.js";
import type { TransformerEngine } from "@/transformer/TransformerEngine.js";
import type { Theme } from "@/theme/Theme.js";
import { normalizeMarkdownLines } from "@/transformer/utils/markdownLines.js";
import type { CherryChangeLineSet } from "./CherryChangeSet.js";
import { BlockIndex } from "./BlockIndex.js";
import { parseWithHashBoundary } from "./HashBoundaryResolver.js";
import { reconcileDom } from "./DomReconciler.js";

/** {@link IncrementalSession.tryUpdate} 的返回值。 */
export interface IncrementalUpdateResult {
  /** 增量是否成功；`false` 时调用方应全量渲染 */
  ok: boolean;
  /** 更新后的 AST 根（失败时为上次 AST） */
  ast: MarkdownNode;
  /** 预览区 HTML（失败时为空串） */
  html: string;
  /** 本次 DOM 变更的块起始行（0-based） */
  changedStartLines: number[];
  /**
   * 失败原因，例如：
   * `no-cache` | `no-changes` | `dom-cache-mismatch` |
   * `no-dirty-range` | `parse-incremental-failed` | `dom-sync-failed` |
   * `dom-blocks-mismatch`
   */
  failReason?: string;
}

/**
 * 增量渲染会话。
 *
 * `blocks[i]` 与 `mount.children[i]` 的 `data-hash` 一致；
 * `blocks[i].startLine` / `endLine` 映射编辑器源码行。
 */
export class IncrementalSession {
  /** 上次渲染对应的归一化源码行（无 `\r`） */
  lines: string[] = [];
  /** 上次 parse 产出的 AST 根 */
  ast: MarkdownNode | null = null;
  /** 上次渲染的可挂载块索引，顺序与 mount 子元素一致 */
  blocks: BlockIndex[] = [];

  /** 清空全部状态；下次渲染将走全量流程。 */
  reset(): void {
    this.lines = [];
    this.ast = null;
    this.blocks = [];
  }

  /**
   * 接管全量 parse + 渲染的结果。
   *
   * @param lines  归一化源码行
   * @param ast    全量 parse 的 AST 根
   * @param blocks 实际挂载到 mount 的块索引
   */
  adoptFullParse(
    lines: string[],
    ast: MarkdownNode,
    blocks: BlockIndex[],
  ): void {
    this.lines = lines;
    this.ast = ast;
    this.blocks = blocks;
  }

  /**
   * 将 mount 子元素序列化为完整 HTML 字符串。
   *
   * @param mount 预览区挂载点
   */
  composeHtml(mount: HTMLElement): string {
    const parts = [...mount.children].map((el) => (el as HTMLElement).outerHTML);
    return parts.length > 0 ? `${parts.join("\n")}\n` : "";
  }

  /**
   * 尝试增量更新：hash 边界 parse → DOM reconcile。
   *
   * 成功时更新 `lines` / `ast` / `blocks`；失败时不 mutate session。
   *
   * @param mount       预览区挂载点
   * @param markdown    编辑后的完整 markdown
   * @param transformer 解析与渲染引擎
   * @param theme       主题（日志与 `preview:dom-updating` 事件）
   * @param changes     CM 行变更集；缺失时直接失败
   */
  tryUpdate(
    mount: HTMLElement,
    markdown: string,
    transformer: TransformerEngine,
    theme: Theme,
    changes?: CherryChangeLineSet[],
  ): IncrementalUpdateResult {
    const prevDomCount = mount.childElementCount;
    const prevBlocks = this.blocks;
    const prevAst = this.ast;

    if (prevBlocks.length === 0 || !prevAst) {
      theme.logD("render:incremental", "abort", { reason: "no-cache" });
      return {
        ok: false,
        ast: prevAst!,
        html: "",
        changedStartLines: [],
        failReason: "no-cache",
      };
    }

    if (prevBlocks.length !== prevDomCount) {
      theme.logD("render:incremental", "abort", {
        reason: `dom-cache-mismatch:dom=${prevDomCount},cache=${prevBlocks.length}`,
      });
      return {
        ok: false,
        ast: prevAst,
        html: "",
        changedStartLines: [],
        failReason: `dom-cache-mismatch:dom=${prevDomCount},cache=${prevBlocks.length}`,
      };
    }

    if (!changes?.length) {
      return {
        ok: false,
        ast: prevAst,
        html: "",
        changedStartLines: [],
        failReason: "no-changes",
      };
    }

    const newLines = normalizeMarkdownLines(markdown);

    /** markdown 行级未变（如光标移动触发的 noop transaction）→ 跳过 parse/DOM */
    if (
      newLines.length === this.lines.length
      && newLines.every((line, i) => line === this.lines[i])
    ) {
      return {
        ok: true,
        ast: prevAst,
        html: this.composeHtml(mount),
        changedStartLines: [],
      };
    }

    let parsed;
    try {
      parsed = parseWithHashBoundary(
        prevAst,
        this.lines,
        newLines,
        changes,
        transformer,
      );
    } catch (err) {
      theme.logD("render:incremental", "abort", {
        reason: err instanceof Error ? err.message : "parse-incremental-failed",
      });
      return {
        ok: false,
        ast: prevAst,
        html: "",
        changedStartLines: [],
        failReason: err instanceof Error ? err.message : "parse-incremental-failed",
      };
    }

    if (!parsed) {
      return {
        ok: false,
        ast: prevAst,
        html: "",
        changedStartLines: [],
        failReason: "no-dirty-range",
      };
    }

    const { resolve } = parsed;
    const ast = prevAst;

    theme.logD("render:incremental", "dirty", {
      dirtyRange: resolve.dirtyNew,
      frontmatterEdited: resolve.frontmatterEdited,
      range: resolve.input.range,
      changedLines: changes,
    });

    theme.emit("preview:dom-updating", {});

    const sync = reconcileDom(mount, ast, transformer, {
      frontmatterEdited: resolve.frontmatterEdited,
      prevBlocks,
    });

    if (!sync.ok) {
      theme.logD("render:incremental", "abort", {
        reason: sync.failReason ?? "dom-sync-failed",
      });
      return {
        ok: false,
        ast,
        html: "",
        changedStartLines: [],
        failReason: sync.failReason ?? "dom-sync-failed",
      };
    }

    if (sync.blocks.length !== mount.childElementCount) {
      theme.logD("render:incremental", "abort", {
        reason: `dom-blocks-mismatch:dom=${mount.childElementCount},blocks=${sync.blocks.length}`,
      });
      return {
        ok: false,
        ast,
        html: "",
        changedStartLines: [],
        failReason: "dom-blocks-mismatch",
      };
    }

    this.lines = newLines;
    this.ast = ast;
    this.blocks = sync.blocks;

    theme.logD("render:incremental", "ok", {
      changedStartLines: sync.changedStartLines,
      unchangedBlocks: sync.blocks.length - sync.changedStartLines.length,
    });

    return {
      ok: true,
      ast,
      html: this.composeHtml(mount),
      changedStartLines: sync.changedStartLines,
    };
  }
}
