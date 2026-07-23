import {
  EditorState,
  StateEffect,
  StateField,
  type Transaction,
} from "@codemirror/state";
import { EditorView, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import type { DiffHunk } from "../diff";
import { hasPendingHunks } from "../diff";
import { Renderer } from "@/renderer/Renderer";
import type { Theme } from "@/theme/Theme";
import { EventBus } from "@/core/event/EventBus";
import type { Log } from "@/core/Log";

export type AIState =
  | { phase: "idle" }
  | {
      phase: "generating";
      from: number;
      to: number;
      original: string;
      genId: number;
      action: string;
      prompts?: string;
    }
  | {
      phase: "diff";
      hunks: DiffHunk[];
    };

export const IDLE_STATE: AIState = { phase: "idle" };

export const setAIState = StateEffect.define<AIState>();

export const aiTransaction = StateEffect.define<null>();

/** 解析事务完成后的 AI 状态。 */
export function resolveAIState(tr: Transaction): AIState {
  let state = tr.startState.field(aiStateField);
  for (const effect of tr.effects) {
    if (effect.is(setAIState)) state = effect.value;
  }
  return state;
}

/** 判断事务是否由 AI 差异流程发起。 */
export function isAITransaction(tr: Transaction): boolean {
  return tr.effects.some((e) => e.is(aiTransaction));
}

/** 正在生成或仍有待确认差异块时锁定编辑 */
export function isAILocked(state: AIState): boolean {
  if (state.phase === "generating") return true;
  if (state.phase === "diff") return hasPendingHunks(state.hunks);
  return false;
}

export const aiStateField = StateField.define<AIState>({
  create() {
    return IDLE_STATE;
  },
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setAIState)) return effect.value;
    }
    return value;
  },
});

let nextGenId = 1;

/** 分配用于忽略过期 AI 请求结果的递增生成标识 */
export function allocGenId(): number {
  return nextGenId++;
}

export const aiLockedReadOnly = EditorState.readOnly.compute(
  [aiStateField],
  (state) => isAILocked(state.field(aiStateField)),
);

export const aiMaskPlugin = ViewPlugin.fromClass(
  class {
    mask: HTMLElement | null = null;
    private thinkingDetails: HTMLDetailsElement | null = null;
    private thinkingMount: HTMLElement | null = null;
    private partialMount: HTMLElement | null = null;
    private bodyEl: HTMLElement | null = null;
    private thinkingRenderer: Renderer | null = null;
    private partialRenderer: Renderer | null = null;

    constructor(readonly view: EditorView) {
      this.sync();
    }

    update(update: ViewUpdate) {
      const prev = update.startState.field(aiStateField);
      const curr = update.state.field(aiStateField);
      if (prev !== curr) this.sync();
    }

    /** 流式更新：传入 delta（增量字符），直接 append 到对应 Renderer。
     *  两个 Renderer 共享 theme 和 logger，各自持有私有 EventBus（不订阅全局主题事件）。
     */
    setStream(
      contentDelta: string | undefined,
      thinkingDelta: string | undefined,
      theme: Theme,
      logger: Log,
    ) {
      if (!this.mask) return;

      if (thinkingDelta && this.thinkingMount) {
        if (!this.thinkingRenderer) {
          this.thinkingRenderer = new Renderer({
            mount: this.thinkingMount,
            theme,
            eventBus: new EventBus(false, "", logger),
            logger,
          });
        }
        this.thinkingRenderer.append(thinkingDelta);
        if (this.thinkingDetails) {
          this.thinkingDetails.hidden = false;
          this.thinkingDetails.open = true;
        }
      }

      if (contentDelta && this.partialMount) {
        if (!this.partialRenderer) {
          this.partialRenderer = new Renderer({
            mount: this.partialMount,
            theme,
            eventBus: new EventBus(false, "", logger),
            logger,
          });
        }
        this.partialRenderer.append(contentDelta);
      }

      if (this.bodyEl) {
        this.bodyEl.scrollTop = this.bodyEl.scrollHeight;
      }
    }

    sync() {
      const generating =
        this.view.state.field(aiStateField).phase === "generating";

      if (generating && !this.mask) {
        this.createMask();
      } else if (!generating && this.mask) {
        this.destroyMask();
      }
    }

    private createMask() {
      const root = this.view.dom.closest(".penna") || this.view.dom;
      const mask = document.createElement("div");
      mask.className = "penna-ai-mask-global";
      mask.setAttribute("aria-busy", "true");
      mask.tabIndex = 0;
      mask.innerHTML = `
          <div class="penna-ai-mask-layout">
            <div class="penna-ai-mask-header">
              <div class="penna-ai-mask-spinner"></div>
              <div class="penna-ai-mask-title">正在处理，请稍候... (按 Esc 取消)</div>
            </div>
            <div class="penna-ai-mask-body">
              <details class="penna-ai-mask-thinking" hidden>
                <summary>思考过程</summary>
                <div class="penna-ai-mask-thinking-content penna-render"></div>
              </details>
              <div class="penna-ai-mask-partial penna-render"></div>
            </div>
          </div>
        `;

      mask.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          e.preventDefault();
          this.view.dispatch({ effects: setAIState.of(IDLE_STATE) });
        }
      });

      this.thinkingDetails = mask.querySelector(
        ".penna-ai-mask-thinking",
      ) as HTMLDetailsElement;
      this.thinkingMount = mask.querySelector(
        ".penna-ai-mask-thinking-content",
      ) as HTMLElement;
      this.partialMount = mask.querySelector(
        ".penna-ai-mask-partial",
      ) as HTMLElement;
      this.bodyEl = mask.querySelector(".penna-ai-mask-body") as HTMLElement;

      root.appendChild(mask);
      mask.focus({ preventScroll: true });
      this.mask = mask;
    }

    private destroyMask() {
      this.thinkingRenderer?.destroy();
      this.partialRenderer?.destroy();
      this.thinkingRenderer = null;
      this.partialRenderer = null;
      this.thinkingDetails = null;
      this.thinkingMount = null;
      this.partialMount = null;
      this.bodyEl = null;
      this.mask?.remove();
      this.mask = null;
    }

    destroy() {
      this.destroyMask();
    }
  },
);
