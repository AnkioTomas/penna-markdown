import { StateField, RangeSetBuilder } from "@codemirror/state";
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
import { buildHunks, hasPendingHunks, type DiffHunk } from "./diffLines";
import { ICON_AI_ACCEPT, ICON_AI_REJECT } from "./defaults";
import { positionFixedPanel } from "./positionPanel";
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

function buildHunkDecorations(
  diff: Extract<AIState, { phase: "diff" }>,
): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();

  for (const hunk of diff.hunks) {
    if (hunk.status !== "pending") continue;

    const startLine = hunk.from;
    const endPos = Math.max(hunk.from, hunk.to);
    builder.add(
      startLine,
      startLine,
      Decoration.line({ class: "cherry-ai-diff-line" }),
    );
    if (endPos > hunk.from) {
      const endLine = hunk.to;
      if (endLine > hunk.from) {
        builder.add(
          endLine,
          endLine,
          Decoration.line({ class: "cherry-ai-diff-line" }),
        );
      }
    }

    const chunks = diffChars(hunk.original, hunk.result);
    let pos = hunk.from;

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
  }

  return builder.finish();
}

export const aiDiffDecorations = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(_deco, tr) {
    const ai = tr.state.field(aiStateField);
    if (ai.phase !== "diff") return Decoration.none;
    return buildHunkDecorations(ai);
  },
  provide: (f) => EditorView.decorations.from(f),
});

function acceptHunk(view: EditorViewType, hunkId: string) {
  const ai = view.state.field(aiStateField);
  if (ai.phase !== "diff") return;

  const hunks = ai.hunks.map((h) =>
    h.id === hunkId ? { ...h, status: "accepted" as const } : h,
  );

  view.dispatch({
    effects: [
      aiTransaction.of(null),
      setAIState.of(
        hasPendingHunks(hunks) ? { phase: "diff", hunks } : IDLE_STATE,
      ),
    ],
  });
}

function rejectHunk(view: EditorViewType, hunkId: string) {
  const ai = view.state.field(aiStateField);
  if (ai.phase !== "diff") return;

  const hunk = ai.hunks.find((h) => h.id === hunkId);
  if (!hunk || hunk.status !== "pending") return;

  const delta = hunk.original.length - (hunk.to - hunk.from);
  const hunks = ai.hunks.map((h) => {
    if (h.id === hunkId) return { ...h, status: "rejected" as const };
    if (h.status === "pending" && h.from >= hunk.to) {
      return { ...h, from: h.from + delta, to: h.to + delta };
    }
    return h;
  });

  const effects = [
    aiTransaction.of(null),
    setAIState.of(
      hasPendingHunks(hunks) ? { phase: "diff", hunks } : IDLE_STATE,
    ),
  ];

  view.dispatch({
    changes: { from: hunk.from, to: hunk.to, insert: hunk.original },
    effects,
  });
}

function buildHunkActionBtn(
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

function buildHunkPanel(view: EditorViewType, hunk: DiffHunk): HTMLElement {
  const dom = document.createElement("div");
  dom.className = "cherry-ai-hunk-actions";
  dom.dataset.hunkId = hunk.id;
  dom.append(
    buildHunkActionBtn(
      "cherry-ai-diff-btn--accept",
      ICON_AI_ACCEPT,
      "接受",
      () => acceptHunk(view, hunk.id),
    ),
    buildHunkActionBtn(
      "cherry-ai-diff-btn--reject",
      ICON_AI_REJECT,
      "拒绝",
      () => rejectHunk(view, hunk.id),
    ),
  );
  return dom;
}

export const aiDiffHunkActionsPlugin = ViewPlugin.fromClass(
  class {
    panels = new Map<string, HTMLElement>();
    private readonly onScroll: () => void;
    private readonly onResize: () => void;

    constructor(readonly view: EditorViewType) {
      this.onScroll = () => this.repositionAll();
      this.onResize = () => this.repositionAll();
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
        this.clearPanels();
        return;
      }

      const pending = ai.hunks.filter((h) => h.status === "pending");
      const pendingIds = new Set(pending.map((h) => h.id));

      for (const [id, panel] of this.panels) {
        if (!pendingIds.has(id)) {
          panel.remove();
          this.panels.delete(id);
        }
      }

      for (const hunk of pending) {
        let panel = this.panels.get(hunk.id);
        if (!panel) {
          panel = buildHunkPanel(this.view, hunk);
          document.body.appendChild(panel);
          this.panels.set(hunk.id, panel);
        }
      }

      requestAnimationFrame(() => this.repositionAll());
    }

    repositionAll() {
      const ai = this.view.state.field(aiStateField);
      if (ai.phase !== "diff") return;

      for (const hunk of ai.hunks) {
        if (hunk.status !== "pending") continue;
        const panel = this.panels.get(hunk.id);
        if (!panel) continue;
        const anchor = hunk.to > hunk.from ? hunk.to : hunk.from;
        positionFixedPanel(this.view, panel, anchor, false);
      }
    }

    clearPanels() {
      for (const panel of this.panels.values()) panel.remove();
      this.panels.clear();
    }

    destroy() {
      this.view.scrollDOM.removeEventListener("scroll", this.onScroll);
      window.removeEventListener("resize", this.onResize);
      this.clearPanels();
    }
  },
);

export function enterDiffPhase(
  view: EditorViewType,
  from: number,
  to: number,
  original: string,
  result: string,
) {
  const hunks = buildHunks(original, result, from);

  if (result === original || hunks.length === 0) {
    view.dispatch({
      effects: [aiTransaction.of(null), setAIState.of(IDLE_STATE)],
    });
    return;
  }

  view.dispatch({
    changes: { from, to, insert: result },
    effects: [
      aiTransaction.of(null),
      setAIState.of({ phase: "diff", hunks }),
      EditorView.scrollIntoView(from, { y: "center" }),
    ],
  });
}

export { acceptHunk, rejectHunk };
