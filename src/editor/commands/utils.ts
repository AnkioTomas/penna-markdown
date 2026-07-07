import { EditorSelection } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";

export interface LineInfo {
  from: number;
  to: number;
  text: string;
  number: number;
}

export function getLineAtCursor(view: EditorView): LineInfo {
  const pos = view.state.selection.main.head;
  const line = view.state.doc.lineAt(pos);
  return {
    from: line.from,
    to: line.to,
    text: line.text,
    number: line.number,
  };
}

export function insertText(
  view: EditorView,
  text: string,
  selectFrom?: number,
  selectTo?: number,
): void {
  const { from, to } = view.state.selection.main;
  const insertAt = from;
  view.dispatch({
    changes: { from, to, insert: text },
    selection:
      selectFrom !== undefined
        ? EditorSelection.range(
            insertAt + selectFrom,
            insertAt + (selectTo ?? selectFrom),
          )
        : undefined,
    scrollIntoView: true,
  });
}

export function wrapSelection(
  view: EditorView,
  before: string,
  after: string,
  placeholder = "text",
): void {
  const { from, to, empty } = view.state.selection.main;
  if (empty) {
    const wrapped = `${before}${placeholder}${after}`;
    view.dispatch({
      changes: { from, to, insert: wrapped },
      selection: EditorSelection.range(
        from + before.length,
        from + before.length + placeholder.length,
      ),
      scrollIntoView: true,
    });
    return;
  }

  const selected = view.state.sliceDoc(from, to);
  view.dispatch({
    changes: { from, to, insert: `${before}${selected}${after}` },
    selection: EditorSelection.range(from + before.length, to + before.length),
    scrollIntoView: true,
  });
}

export function replaceLineText(view: EditorView, line: LineInfo, newText: string): void {
  view.dispatch({
    changes: { from: line.from, to: line.to, insert: newText },
    scrollIntoView: true,
  });
}

export function getSelectionText(view: EditorView): string {
  const { from, to, empty } = view.state.selection.main;
  if (empty) return "";
  return view.state.sliceDoc(from, to);
}

export function hasSelection(view: EditorView): boolean {
  return !view.state.selection.main.empty;
}

export function focusView(view: EditorView): void {
  view.focus();
}

const HEADING_PREFIX_RE = /^#{1,6}\s+/;

export function setLinePrefix(view: EditorView, prefix: string): boolean {
  const line = getLineAtCursor(view);
  const stripped = line.text.replace(HEADING_PREFIX_RE, "");
  replaceLineText(view, line, prefix + stripped);
  return true;
}
