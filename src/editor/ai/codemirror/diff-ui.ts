import {
  StateField,
  RangeSetBuilder,
  type Extension,
  type Text,
} from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  WidgetType,
  keymap,
  type EditorView as EditorViewType,
  type ViewUpdate,
} from "@codemirror/view";
import { buildHunks, hasPendingHunks, type DiffHunk } from "../diff";
import {
  IDLE_STATE,
  aiStateField,
  aiTransaction,
  resolveAIState,
  setAIState,
  type AIState,
} from "./extension";

const ICON_SIZE = 18;

function svg(path: string): string {
  return `<svg viewBox="0 0 24 24" width="${ICON_SIZE}" height="${ICON_SIZE}" class="cherry-ai-icon" aria-hidden="true"><path fill="currentColor" d="${path}"/></svg>`;
}

const ICON_AI_ACCEPT = svg(
  "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
);

const ICON_AI_REJECT = svg(
  "M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z",
);

/** 在变更行上方展示被删除的整行内容 */
class DeletedLinesWidget extends WidgetType {
  constructor(readonly lines: string[]) {
    super();
  }

  eq(other: DeletedLinesWidget) {
    return (
      other.lines.length === this.lines.length &&
      other.lines.every((line, i) => line === this.lines[i])
    );
  }

  toDOM() {
    const block = document.createElement("div");
    block.className = "cherry-ai-diff-del-block";
    for (const line of this.lines) {
      const row = document.createElement("div");
      row.className = "cherry-ai-diff-del-line";
      row.textContent = line;
      block.appendChild(row);
    }
    return block;
  }

  ignoreEvent() {
    return true;
  }
}

function splitDisplayLines(text: string): string[] {
  if (!text) return [];
  const parts = text.split("\n");
  if (parts.length > 1 && parts[parts.length - 1] === "") {
    parts.pop();
  }
  return parts;
}

function docAfterTransaction(tr: {
  startState: { doc: Text };
  changes: { empty: boolean; apply: (doc: Text) => Text };
}): Text {
  return tr.changes.empty
    ? tr.startState.doc
    : tr.changes.apply(tr.startState.doc);
}

function hunkAnchorPos(hunk: DiffHunk): number {
  return hunk.from;
}

function buildHunkDecorations(
  diff: Extract<AIState, { phase: "diff" }>,
  doc: Text,
): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const hunks = [...diff.hunks]
    .filter((h) => h.status === "pending")
    .sort((a, b) => a.from - b.from);

  type PendingDeco = { pos: number; kind: 0 | 1; deco: Decoration };
  const pending: PendingDeco[] = [];

  for (const hunk of hunks) {
    const deletedLines = splitDisplayLines(hunk.original);
    if (deletedLines.length > 0) {
      pending.push({
        pos: hunk.from,
        kind: 0,
        deco: Decoration.widget({
          widget: new DeletedLinesWidget(deletedLines),
          block: true,
          side: -1,
        }),
      });
    }

    if (hunk.to > hunk.from) {
      let pos = hunk.from;
      while (pos < hunk.to) {
        const line = doc.lineAt(pos);
        pending.push({
          pos: line.from,
          kind: 1,
          deco: Decoration.line({ class: "cherry-ai-diff-line" }),
        });
        pos = line.to + 1;
      }
    } else if (deletedLines.length > 0) {
      const line = doc.lineAt(hunk.from);
      pending.push({
        pos: line.from,
        kind: 1,
        deco: Decoration.line({
          class: "cherry-ai-diff-line cherry-ai-diff-line--del-only",
        }),
      });
    }
  }

  pending.sort((a, b) => a.pos - b.pos || a.kind - b.kind);
  for (const item of pending) {
    builder.add(item.pos, item.pos, item.deco);
  }

  return builder.finish();
}

export const aiDiffDecorations = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(_deco, tr) {
    const ai = resolveAIState(tr);
    if (ai.phase !== "diff") return Decoration.none;
    const doc = docAfterTransaction(tr);
    return buildHunkDecorations(ai, doc);
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

  view.dispatch({
    changes: { from: hunk.from, to: hunk.to, insert: hunk.original },
    effects: [
      aiTransaction.of(null),
      setAIState.of(
        hasPendingHunks(hunks) ? { phase: "diff", hunks } : IDLE_STATE,
      ),
    ],
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
  btn.title = label;
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

function positionHunkPanel(
  view: EditorViewType,
  panel: HTMLElement,
  hunk: DiffHunk,
) {
  const coords = view.coordsAtPos(hunkAnchorPos(hunk));
  const scrollerRect = view.scrollDOM.getBoundingClientRect();

  if (!coords) {
    panel.style.display = "none";
    return;
  }

  const margin = 8;
  const panelW = panel.offsetWidth || 140;
  const panelH = panel.offsetHeight || 32;
  const lineMid = coords.top + (coords.bottom - coords.top) / 2;

  let top = lineMid - panelH / 2;
  let left = scrollerRect.right - panelW - margin;

  const minTop = scrollerRect.top + margin;
  const maxTop = scrollerRect.bottom - panelH - margin;
  top = Math.max(minTop, Math.min(top, maxTop));

  const minLeft = scrollerRect.left + margin;
  left = Math.max(minLeft, left);

  panel.style.display = "flex";
  panel.style.position = "fixed";
  panel.style.left = `${left}px`;
  panel.style.top = `${top}px`;
  panel.style.zIndex = "10000";
}

export const aiDiffHunkActionsPlugin = ViewPlugin.fromClass(
  class {
    panels = new Map<string, HTMLElement>();
    readonly onScroll: () => void;
    readonly onResize: () => void;

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
        if (!this.panels.has(hunk.id)) {
          const panel = buildHunkPanel(this.view, hunk);
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
        positionHunkPanel(this.view, panel, hunk);
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

/** Esc 取消差异确认：从后向前拒绝全部待确认块 */
export function cancelDiffPhase(view: EditorViewType) {
  const ai = view.state.field(aiStateField);
  if (ai.phase !== "diff") return;

  const pending = ai.hunks
    .filter((h) => h.status === "pending")
    .sort((a, b) => b.from - a.from);
  for (const hunk of pending) {
    rejectHunk(view, hunk.id);
  }
}

/** Esc 取消 AI 生成或差异确认 */
export function createAIKeymap(): Extension {
  return keymap.of([
    {
      key: "Escape",
      run(view) {
        const ai = view.state.field(aiStateField);
        if (ai.phase === "generating") {
          view.dispatch({ effects: setAIState.of(IDLE_STATE) });
          return true;
        }
        if (ai.phase === "diff") {
          cancelDiffPhase(view);
          return true;
        }
        return false;
      },
    },
  ]);
}
