import { StateField, RangeSetBuilder, type Text } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  WidgetType,
  type EditorView as EditorViewType,
  type ViewUpdate,
} from "@codemirror/view";
import { diffChars } from "./diffChars";
import { ICON_AI_ACCEPT, ICON_AI_REJECT } from "./defaults";
import { getVisibleAnchor, positionFixedPanel } from "./positionPanel";
import {
  IDLE_STATE,
  aiStateField,
  aiTransaction,
  setAIState,
  type AIState,
} from "./aiState";

class DeletedTextWidget extends WidgetType {
  constructor(readonly text: string) {
    super();
  }

  eq(other: DeletedTextWidget) {
    return other.text === this.text;
  }

  toDOM() {
    const span = document.createElement("span");
    span.className = "cherry-ai-diff-del";
    span.textContent = this.text;
    return span;
  }

  ignoreEvent() {
    return true;
  }
}

function buildDiffDecorations(
  diff: Extract<AIState, { phase: "diff" }>,
  doc: Text,
): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const chunks = diffChars(diff.original, diff.result);
  let pos = diff.from;

  const endPos = Math.min(diff.to, doc.length);
  const startLine = doc.lineAt(diff.from).number;
  const endLine = doc.lineAt(Math.max(diff.from, endPos)).number;
  for (let n = startLine; n <= endLine; n++) {
    const line = doc.line(n);
    builder.add(
      line.from,
      line.from,
      Decoration.line({ class: "cherry-ai-diff-line" }),
    );
  }

  for (const chunk of chunks) {
    if (chunk.type === "equal") {
      pos += chunk.value.length;
    } else if (chunk.type === "add") {
      const from = pos;
      const to = pos + chunk.value.length;
      builder.add(from, to, Decoration.mark({ class: "cherry-ai-diff-add" }));
      pos = to;
    } else if (chunk.type === "del") {
      builder.add(
        pos,
        pos,
        Decoration.widget({
          widget: new DeletedTextWidget(chunk.value),
          side: -1,
        }),
      );
    }
  }

  return builder.finish();
}

export const aiDiffDecorations = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(deco, tr) {
    const ai = tr.state.field(aiStateField);
    if (ai.phase !== "diff") return Decoration.none;
    return buildDiffDecorations(ai, tr.state.doc);
  },
  provide: (f) => EditorView.decorations.from(f),
});

function acceptDiff(view: EditorViewType) {
  const ai = view.state.field(aiStateField);
  if (ai.phase !== "diff") return;

  view.dispatch({
    effects: [aiTransaction.of(null), setAIState.of(IDLE_STATE)],
  });
}

function rejectDiff(view: EditorViewType) {
  const ai = view.state.field(aiStateField);
  if (ai.phase !== "diff") return;

  view.dispatch({
    changes: { from: ai.from, to: ai.to, insert: ai.original },
    effects: [aiTransaction.of(null), setAIState.of(IDLE_STATE)],
  });
}

/** 在状态已离开 diff 阶段时，用快照回滚（手动编辑触发自动 Reject） */
export function rejectDiffSnapshot(
  view: EditorViewType,
  snapshot: Extract<AIState, { phase: "diff" }>,
) {
  view.dispatch({
    changes: {
      from: snapshot.from,
      to: snapshot.to,
      insert: snapshot.original,
    },
    effects: [aiTransaction.of(null)],
  });
}

function buildDiffActionBtn(
  className: string,
  icon: string,
  label: string,
  onClick: () => void,
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `cherry-ai-diff-btn ${className}`;
  btn.setAttribute("aria-label", label);
  btn.innerHTML = icon;
  const text = document.createElement("span");
  text.className = "cherry-ai-diff-btn-label";
  text.textContent = label;
  btn.appendChild(text);
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  });
  return btn;
}

function buildDiffActionsPanel(view: EditorViewType): HTMLElement {
  const dom = document.createElement("div");
  dom.className = "cherry-ai-diff-actions";

  dom.append(
    buildDiffActionBtn(
      "cherry-ai-diff-btn--accept",
      ICON_AI_ACCEPT,
      "接受",
      () => acceptDiff(view),
    ),
    buildDiffActionBtn(
      "cherry-ai-diff-btn--reject",
      ICON_AI_REJECT,
      "拒绝",
      () => rejectDiff(view),
    ),
  );

  return dom;
}

function positionDiffActionsPanel(
  view: EditorViewType,
  panel: HTMLElement,
  diff: Extract<AIState, { phase: "diff" }>,
) {
  const anchor = getVisibleAnchor(view, diff.from, diff.to);
  positionFixedPanel(view, panel, anchor, true);
}

export const aiDiffActionsPlugin = ViewPlugin.fromClass(
  class {
    panel: HTMLElement | null = null;
    private readonly onScroll: () => void;
    private readonly onResize: () => void;

    constructor(readonly view: EditorViewType) {
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
      if (prev !== curr || update.geometryChanged || update.viewportChanged) {
        this.sync();
      }
    }

    sync() {
      const ai = this.view.state.field(aiStateField);
      if (ai.phase !== "diff") {
        this.panel?.remove();
        this.panel = null;
        return;
      }

      if (!this.panel) {
        this.panel = buildDiffActionsPanel(this.view);
        document.body.appendChild(this.panel);
      }

      requestAnimationFrame(() => {
        if (!this.panel) return;
        const current = this.view.state.field(aiStateField);
        if (current.phase !== "diff") return;
        positionDiffActionsPanel(this.view, this.panel, current);
      });
    }

    reposition() {
      const ai = this.view.state.field(aiStateField);
      if (ai.phase !== "diff" || !this.panel) return;
      positionDiffActionsPanel(this.view, this.panel, ai);
    }

    destroy() {
      this.view.scrollDOM.removeEventListener("scroll", this.onScroll);
      window.removeEventListener("resize", this.onResize);
      this.panel?.remove();
      this.panel = null;
    }
  },
);

/** 将 AI 结果写入文档并进入 diff 阶段 */
export function enterDiffPhase(
  view: EditorViewType,
  from: number,
  to: number,
  original: string,
  result: string,
) {
  view.dispatch({
    changes: { from, to, insert: result },
    effects: [
      aiTransaction.of(null),
      setAIState.of({
        phase: "diff",
        from,
        to: from + result.length,
        original,
        result,
      }),
      EditorView.scrollIntoView(from, { y: "center" }),
    ],
  });
}

export { acceptDiff, rejectDiff };
