import {
  keymap,
  ViewPlugin,
  type EditorView,
  type ViewUpdate,
} from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import type { ResolvedAIItem } from "./defaults";
import { enterDiffPhase } from "./aiDiff";
import { getVisibleAnchor, positionFixedPanel } from "./positionPanel";
import {
  IDLE_STATE,
  aiStateField,
  allocGenId,
  setAIState,
  type AIState,
} from "./aiState";

type AIRequestFn = (
  action: string,
  text: string,
  prompts?: string,
) => Promise<string>;

type BubblePhase = Extract<AIState, { phase: "bubble" | "custom" }>;

function isBubblePhase(state: AIState): state is BubblePhase {
  return state.phase === "bubble" || state.phase === "custom";
}

function bubbleKey(ai: BubblePhase): string {
  return `${ai.phase}:${ai.from}:${ai.to}`;
}

function buildBubbleDOM(
  view: EditorView,
  ai: BubblePhase,
  items: ResolvedAIItem[],
  aiRequest: AIRequestFn,
): HTMLElement {
  const dom = document.createElement("div");
  dom.className = "cherry-ai-bubble";

  const text = view.state.doc.sliceString(ai.from, ai.to);

  const startGeneration = (action: string, prompts?: string) => {
    const genId = allocGenId();
    view.dispatch({
      effects: setAIState.of({
        phase: "generating",
        from: ai.from,
        to: ai.to,
        original: text,
        genId,
        action,
        prompts,
      }),
    });

    aiRequest(action, text, prompts)
      .then((result) => {
        const current = view.state.field(aiStateField);
        if (current.phase !== "generating" || current.genId !== genId) return;
        enterDiffPhase(view, ai.from, ai.to, text, result);
      })
      .catch(() => {
        const current = view.state.field(aiStateField);
        if (current.phase !== "generating" || current.genId !== genId) return;
        view.dispatch({ effects: setAIState.of(IDLE_STATE) });
      });
  };

  if (ai.phase === "custom") {
    const row = document.createElement("div");
    row.className = "cherry-ai-custom-row";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "cherry-ai-custom-input";
    input.placeholder = "输入你的要求…";
    input.setAttribute("aria-label", "自定义 AI 要求");

    const confirmBtn = document.createElement("button");
    confirmBtn.type = "button";
    confirmBtn.className = "cherry-ai-custom-confirm";
    confirmBtn.textContent = "执行";
    confirmBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const value = input.value.trim();
      if (!value) return;
      startGeneration("custom", value);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        confirmBtn.click();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        view.dispatch({
          effects: setAIState.of({ phase: "bubble", from: ai.from, to: ai.to }),
        });
      }
    });

    row.append(input, confirmBtn);
    dom.appendChild(row);
    queueMicrotask(() => input.focus());
    return dom;
  }

  const actions = document.createElement("div");
  actions.className = "cherry-ai-bubble-actions";

  for (const item of items) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cherry-ai-bubble-btn";
    btn.title = item.label;
    btn.setAttribute("aria-label", item.label);
    btn.innerHTML = item.icon;

    const label = document.createElement("span");
    label.className = "cherry-ai-bubble-label";
    label.textContent = item.label;
    btn.appendChild(label);

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (item.isCustom) {
        view.dispatch({
          effects: setAIState.of({
            phase: "custom",
            from: ai.from,
            to: ai.to,
          }),
        });
      } else {
        startGeneration(item.id);
      }
    });

    actions.appendChild(btn);
  }

  dom.appendChild(actions);
  return dom;
}

function createAIKeymap(): Extension {
  return keymap.of([
    {
      key: "Escape",
      run(view) {
        const ai = view.state.field(aiStateField);
        if (ai.phase === "generating") {
          view.dispatch({ effects: setAIState.of(IDLE_STATE) });
          return true;
        }
        if (ai.phase === "custom") {
          view.dispatch({
            effects: setAIState.of({
              phase: "bubble",
              from: ai.from,
              to: ai.to,
            }),
          });
          return true;
        }
        if (ai.phase === "bubble") {
          view.dispatch({ effects: setAIState.of(IDLE_STATE) });
          return true;
        }
        return false;
      },
    },
  ]);
}

export function createAIBubblePlugin(
  items: ResolvedAIItem[],
  aiRequest: AIRequestFn,
): Extension {
  return ViewPlugin.fromClass(
    class {
      bubble: HTMLElement | null = null;
      private activeKey: string | null = null;
      private readonly onScroll: () => void;
      private readonly onResize: () => void;

      constructor(readonly view: EditorView) {
        this.onScroll = () => this.reposition();
        this.onResize = () => this.reposition();
        view.scrollDOM.addEventListener("scroll", this.onScroll, {
          passive: true,
        });
        window.addEventListener("resize", this.onResize, { passive: true });
        this.sync();
      }

      update(update: ViewUpdate) {
        const prev = update.startState.field(aiStateField);
        const curr = update.state.field(aiStateField);
        if (
          prev !== curr ||
          update.geometryChanged ||
          update.viewportChanged ||
          update.selectionSet
        ) {
          this.sync();
        }
      }

      sync() {
        const ai = this.view.state.field(aiStateField);
        if (!isBubblePhase(ai)) {
          this.removeBubble();
          return;
        }

        const key = bubbleKey(ai);
        if (!this.bubble || this.activeKey !== key) {
          this.removeBubble();
          this.bubble = buildBubbleDOM(this.view, ai, items, aiRequest);
          document.body.appendChild(this.bubble);
          this.activeKey = key;
        }

        requestAnimationFrame(() => {
          if (!this.bubble) return;
          const current = this.view.state.field(aiStateField);
          if (!isBubblePhase(current)) return;
          this.reposition();
        });
      }

      reposition() {
        const ai = this.view.state.field(aiStateField);
        if (!isBubblePhase(ai) || !this.bubble) return;
        const anchor = getVisibleAnchor(this.view, ai.from, ai.to);
        positionFixedPanel(this.view, this.bubble, anchor, true);
      }

      removeBubble() {
        this.bubble?.remove();
        this.bubble = null;
        this.activeKey = null;
      }

      destroy() {
        this.view.scrollDOM.removeEventListener("scroll", this.onScroll);
        window.removeEventListener("resize", this.onResize);
        this.removeBubble();
      }
    },
  );
}

export function createAIBubbleExtensions(
  items: ResolvedAIItem[],
  aiRequest: AIRequestFn,
): Extension[] {
  return [createAIBubblePlugin(items, aiRequest), createAIKeymap()];
}
