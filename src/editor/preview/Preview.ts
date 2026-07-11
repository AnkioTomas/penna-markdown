import type { Transaction } from "@codemirror/state";
import { Renderer } from "@/renderer/Renderer";
import type { PreviewOptions } from "./PreviewOptions";
import { THEME_EVENT_LIGHT_DARK } from "@/theme/event/ThemeLightDarkEvent";
import { THEME_EVENT_SKIN } from "@/theme/event/ThemeSkinEvent";
import type { Theme } from "@/theme/Theme";
import type { EventBus } from "@/core/event/EventBus";
import { debounce } from "@/core/debounce";
import type { Log } from "@/core/Log";
import { CherryChangeLineSet } from "@/renderer/incremental/CherryChangeSet";
import type { RenderResult } from "@/renderer/RenderResult";
import type { ParserStore } from "@/transformer/core/ParserStore";
import type {
  CherryLayoutPayload,
  EditorChangePayload,
  PreviewRenderedPayload,
} from "@/editor/events";

export class Preview {
  private readonly eventBus: EventBus;
  private readonly renderer: Renderer;
  private readonly debug: boolean;
  private lastMarkdown = "";
  private readonly scheduleRender = debounce(() => this.flushRender(), 50);
  private readonly offs = new Set<() => void>();

  /**
   * 创建预览渲染器，并订阅编辑、主题和强制刷新事件。
   *
   * @param mount 承载渲染结果的 DOM 元素。
   * @param theme 当前编辑器使用的主题实例。
   * @param eventBus 用于接收和发布预览相关事件的事件总线。
   * @param logger 渲染器使用的日志记录器。
   * @param options 预览渲染及自定义解析器选项。
   */
  constructor(
    mount: HTMLElement,
    theme: Theme,
    eventBus: EventBus,
    logger: Log,
    options: PreviewOptions = {},
  ) {
    this.eventBus = eventBus;
    this.debug = eventBus.isDebug();
    this.renderer = new Renderer({
      mount,
      theme,
      eventBus,
      logger,
      inlineParsers: options.transformerEngineOptions?.inlineParsers,
      blockParsers: options.transformerEngineOptions?.blockParsers,
    });

    this.offs.add(
      eventBus.on<EditorChangePayload>("editor:change", (payload) => {
        this.onEditorChange(payload.markdown, payload.tr);
      }),
    );
    this.offs.add(
      eventBus.on(THEME_EVENT_LIGHT_DARK, () => {
        if (this.lastMarkdown) this.onEditorChange(this.lastMarkdown);
      }),
    );
    this.offs.add(
      eventBus.on(THEME_EVENT_SKIN, () => {
        if (this.lastMarkdown) this.onEditorChange(this.lastMarkdown);
      }),
    );
    this.offs.add(
      eventBus.on<CherryLayoutPayload>("cherry:layout", (payload) => {
        if (payload.mode === "preview" && options.maxWidth) {
          mount.style.maxWidth =
            typeof options.maxWidth === "number"
              ? `${options.maxWidth}px`
              : options.maxWidth;
          mount.style.marginLeft = "auto";
          mount.style.marginRight = "auto";
          if (mount.parentElement) {
            mount.parentElement.style.backgroundColor = "var(--cherry-c-bg)";
          }
        } else {
          mount.style.maxWidth = "";
          mount.style.marginLeft = "";
          mount.style.marginRight = "";
          if (mount.parentElement) {
            mount.parentElement.style.backgroundColor = "";
          }
        }
      }),
    );
    this.offs.add(
      eventBus.on("preview:force-refresh", () => {
        if (this.lastMarkdown) {
          this.scheduleRender.cancel();
          this.pendingTransactions = [];
          const mount = this.renderer.getMount();
          const scrollTop = mount.scrollTop;

          const { result, durationMs } = this.measureFullRender(
            this.lastMarkdown,
          );

          // DOM 替换后恢复滚动位置，避免强制重置到顶部导致滚动同步引擎误判
          mount.scrollTop = scrollTop;

          this.emitRendered(this.lastMarkdown, result, [], durationMs);
        }
      }),
    );
  }

  /**
   * 最近一次成功渲染的 store；尚未渲染时返回 `null`。
   *
   * @returns 当前解析存储，或尚无渲染结果时的 `null`。
   */
  getStore(): ParserStore | null {
    return this.renderer.getStore();
  }

  private pendingTransactions: Transaction[] = [];

  /**
   * 收集编辑事务并按需立即或防抖触发预览渲染。
   *
   * @param markdown 编辑器变更后的完整 Markdown 内容。
   * @param tr 生成本次内容的可选 CodeMirror 事务列表。
   */
  private onEditorChange(markdown: string, tr?: readonly Transaction[]): void {
    this.lastMarkdown = markdown;
    if (tr?.length) {
      this.pendingTransactions.push(...tr);
    }

    if (this.rendererNeedsFirstPaint()) {
      this.scheduleRender.cancel();
      this.flushRender();
      return;
    }

    this.scheduleRender();
  }

  /** 执行一次增量或全量预览渲染并发布 `preview:rendered`。 */
  private flushRender(): void {
    const markdown = this.lastMarkdown;
    const transactionsToProcess = this.pendingTransactions;
    this.pendingTransactions = [];

    const changes = this.convert2CherryChanges(
      transactionsToProcess.length > 0 ? transactionsToProcess : undefined,
    );
    const { result, durationMs } = this.measureRender(markdown, changes);
    this.emitRendered(
      markdown,
      result,
      result.changedStartLines ?? [],
      durationMs,
    );
  }

  /**
   * 测量一次 `render` 调用耗时（仅 debug 模式）。
   */
  private measureRender(
    markdown: string,
    changes?: CherryChangeLineSet[],
  ): { result: RenderResult; durationMs?: number } {
    if (!this.debug) {
      return { result: this.renderer.render(markdown, changes) };
    }
    const t0 = performance.now();
    const result = this.renderer.render(markdown, changes);
    return { result, durationMs: performance.now() - t0 };
  }

  /**
   * 测量一次 `renderFull` 调用耗时（仅 debug 模式）。
   */
  private measureFullRender(markdown: string): {
    result: RenderResult;
    durationMs?: number;
  } {
    if (!this.debug) {
      return { result: this.renderer.renderFull(markdown) };
    }
    const t0 = performance.now();
    const result = this.renderer.renderFull(markdown);
    return { result, durationMs: performance.now() - t0 };
  }

  /**
   * 组装 `preview:rendered` 载荷并发布。
   */
  private emitRendered(
    markdown: string,
    result: RenderResult,
    changedStartLines: number[],
    durationMs?: number,
  ): void {
    const rendered: PreviewRenderedPayload = {
      markdown,
      html: result.html,
      ast: result.ast,
      blocks: result.blocks,
      toc: this.renderer.getToc(),
      partial: result.partial ?? false,
      changedStartLines,
    };

    if (this.debug && durationMs != null) {
      if (result.partial) {
        rendered.incrementalRenderMs = durationMs;
      } else {
        rendered.fullRenderMs = durationMs;
      }
    }

    this.eventBus.emit("preview:rendered", rendered);
  }

  /**
   * 判断预览容器是否尚未完成首次渲染。
   *
   * @returns 容器没有任何已渲染子节点时为 `true`。
   */
  private rendererNeedsFirstPaint(): boolean {
    return this.renderer.getMount().childElementCount === 0;
  }

  /**
   * 将连续的 CodeMirror 文档事务合成为增量渲染所需的行级变更集。
   *
   * @param transactions 待合并的 CodeMirror 事务列表。
   * @returns 可用于增量渲染的变更集；没有文档变更时返回 `undefined`。
   */
  private convert2CherryChanges(
    transactions?: readonly Transaction[],
  ): CherryChangeLineSet[] | undefined {
    if (!transactions?.length) return undefined;

    const validTrs = transactions.filter((t) => t.docChanged);
    if (validTrs.length === 0) return undefined;

    let mergedChanges = validTrs[0]!.changes;
    for (let i = 1; i < validTrs.length; i++) {
      mergedChanges = mergedChanges.compose(validTrs[i]!.changes);
    }

    const list: CherryChangeLineSet[] = [];
    const oldDoc = validTrs[0]!.startState.doc;
    const newDoc = validTrs[validTrs.length - 1]!.state.doc;

    mergedChanges.iterChanges((fromA, toA, fromB, toB) => {
      const fromLineA = oldDoc.lineAt(fromA).number;
      const toLineA = oldDoc.lineAt(toA).number;

      const fromLineB = newDoc.lineAt(fromB).number;
      const toLineB = newDoc.lineAt(toB).number;

      const deletedLines = toLineA - fromLineA;
      const insertedLines = toLineB - fromLineB;

      const isFullDocument = fromA === 0 && toA === oldDoc.length;

      list.push({
        fromA: fromLineA,
        toA: toLineA,
        fromB: fromLineB,
        toB: toLineB,
        deletedLines,
        insertedLines,
        isFullDocument,
      });
    });

    return list.length > 0 ? list : undefined;
  }

  /** 取消待执行渲染、注销事件订阅并销毁底层渲染器。 */
  destroy(): void {
    this.scheduleRender.cancel();
    for (const off of this.offs) off();
    this.offs.clear();
    this.renderer.destroy();
  }
}
