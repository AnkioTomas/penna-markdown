import { EditorSelection } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { insertText, wrapSelection } from "./utils.js";
export function toggleInlineWrap(
  view: EditorView,
  before: string,
  after: string,
  placeholder = "",
): void {
  const { from, to, empty } = view.state.selection.main;
  if (empty) {
    wrapSelection(view, before, after, placeholder);
    return;
  }

  const selected = view.state.sliceDoc(from, to);
  if (
    selected.startsWith(before) &&
    selected.endsWith(after) &&
    selected.length >= before.length + after.length
  ) {
    const inner = selected.slice(before.length, selected.length - after.length);
    view.dispatch({
      changes: { from, to, insert: inner },
      selection: EditorSelection.range(from, from + inner.length),
      scrollIntoView: true,
    });
    return;
  }

  wrapSelection(view, before, after, placeholder);
}

/** 跨行选区：按行分别包裹/拆包 */
export function toggleInlinePerLine(
  view: EditorView,
  before: string,
  after: string,
  placeholder = "",
): void {
  const { from, to, empty } = view.state.selection.main;
  if (empty) {
    toggleInlineWrap(view, before, after, placeholder);
    return;
  }

  const startLine = view.state.doc.lineAt(from);
  const endLine = view.state.doc.lineAt(to);
  if (startLine.number === endLine.number) {
    toggleInlineWrap(view, before, after, placeholder);
    return;
  }

  const changes: { from: number; to: number; insert: string }[] = [];
  for (let n = startLine.number; n <= endLine.number; n++) {
    const line = view.state.doc.line(n);
    let sliceFrom = line.from;
    let sliceTo = line.to;
    if (n === startLine.number) sliceFrom = from;
    if (n === endLine.number) sliceTo = to;
    if (sliceFrom >= sliceTo) continue;

    const part = view.state.sliceDoc(sliceFrom, sliceTo);
    if (part.startsWith(before) && part.endsWith(after)) {
      changes.push({
        from: sliceFrom,
        to: sliceTo,
        insert: part.slice(before.length, part.length - after.length),
      });
    } else {
      changes.push({ from: sliceFrom, to: sliceTo, insert: `${before}${part}${after}` });
    }
  }

  if (changes.length) {
    view.dispatch({ changes, scrollIntoView: true });
  }
}

/** 在选区末尾或光标处追加 HTML 属性，不插入占位文本 */
export function appendHtmlAttr(view: EditorView, rawAttr: string): void {
  const attr = normalizeHtmlAttr(rawAttr);
  if (!attr) return;

  const { from, to, empty } = view.state.selection.main;
  const insertAt = empty ? from : to;
  view.dispatch({
    changes: { from: insertAt, to: insertAt, insert: attr },
    selection: EditorSelection.cursor(insertAt + attr.length),
    scrollIntoView: true,
  });
}

export function normalizeHtmlAttr(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
  if (trimmed.startsWith(".")) return `{${trimmed}}`;
  if (trimmed.startsWith("#")) return `{${trimmed}}`;
  if (trimmed.includes("=")) return `{${trimmed}}`;
  return `{.${trimmed}}`;
}

/** 在文档顶部插入内容（用于 YAML 头） */
export function insertAtDocumentTop(view: EditorView, text: string): void {
  const doc = view.state.doc.toString();
  const fm = doc.match(/^---\n[\s\S]*?\n---\n*/);
  if (fm) {
    view.dispatch({
      changes: { from: 0, to: fm[0].length, insert: text.endsWith("\n") ? text : `${text}\n` },
      selection: EditorSelection.cursor(0),
      scrollIntoView: true,
    });
    return;
  }

  const block = text.endsWith("\n\n") ? text : `${text}\n\n`;
  view.dispatch({
    changes: { from: 0, to: 0, insert: block },
    selection: EditorSelection.cursor(0),
    scrollIntoView: true,
  });
}

/** 在文档末尾追加块 */
export function appendToDocumentEnd(view: EditorView, text: string): void {
  const end = view.state.doc.length;
  const needsNl = end > 0 && view.state.doc.sliceString(end - 1, end) !== "\n";
  const insert = needsNl ? `\n${text}` : text;
  view.dispatch({
    changes: { from: end, to: end, insert },
    scrollIntoView: true,
  });
}
