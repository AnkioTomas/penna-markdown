/**
 * 编辑命令核心模块。
 *
 * 定义 {@link Command} 接口及 CodeMirror 6 文档编辑原语。
 * 所有具体命令（groups/）最终通过这里的函数修改编辑器状态。
 */
import { EditorSelection } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import type { EventBus } from "@/core/event/EventBus";
import type { Theme } from "@/theme/Theme";
import { ParserStore } from "@/transformer/core/ParserStore";
import type {
  OnAiRequest,
  OnAiRequestCancel,
} from "@/editor/editor/EditorOptions";
import type { Log } from "@/core/Log";

/** 命令注册表中的命令名字符串，如 `"bold"`、`"link"`。 */
export type EditorCommand = string;

/**
 * 命令执行上下文。
 * 弹窗类命令需要 `eventBus` 以触发 `editor:dialog:open` 事件；
 * 主题切换命令需要 `theme`。
 */
export interface CommandContext {
  /** 实例级事件总线，用于对话框等跨模块通讯。 */
  eventBus?: EventBus;
  /** 主题实例，用于 `setTheme` 等皮肤 API。 */
  theme?: Theme;
  /** 日志实例，供命令内部使用。 */
  logger?: Log;
  /**
   * 获取最近一次成功渲染的 ParserStore。
   * 尚未渲染或无 AST 时返回 `null`（禁止伪造空 store）。
   */
  getStore?: () => ParserStore | null;
  /** AI 请求回调，AI 命令执行时使用。 */
  onAiRequest?: OnAiRequest;
  /** AI 请求取消回调，用于停止 AI 生成。 */
  onAiRequestCancel?: OnAiRequestCancel;
}

/** 光标所在行的位置与文本信息。 */
export interface LineInfo {
  from: number;
  to: number;
  text: string;
  number: number;
}

const HEADING_PREFIX_RE = /^#{1,6}\s+/;

/**
 * 所有编辑命令必须实现的接口。
 * 由 {@link runCommand} 统一调度。
 */
export interface Command {
  /**
   * 执行命令。
   * @param view - CodeMirror 编辑器实例
   * @param payload - 可选参数（如 `insertText` 的 `{ text }`、`setTheme` 的 `{ id }`）
   * @param ctx - 执行上下文，弹窗命令需传入 `theme`
   * @returns 是否成功；弹窗命令可能返回 Promise
   */
  execute(
    view: EditorView,
    payload: unknown,
    ctx: CommandContext,
  ): boolean | Promise<boolean>;
}

/**
 * 获取主光标所在行的范围与内容。
 * @param view - 要读取状态的 CodeMirror 编辑器实例
 * @returns 行的起止位置、文本和一基行号
 */
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

/**
 * 在选区处插入文本，可选设置插入后的选区范围。
 * @param view - 要写入的 CodeMirror 编辑器实例
 * @param text - 替换当前选区的文本
 * @param selectFrom - 相对于插入起点的选区起始偏移
 * @param selectTo - 相对于插入起点的选区结束偏移
 */
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

/**
 * 智能插入块级 Markdown 片段。
 * 空选区时自动补换行；光标在行首空行时从行首插入。
 * @param view - 要写入的 CodeMirror 编辑器实例
 * @param snippet - 待插入的块级 Markdown 片段
 * @param selectFrom - 相对于最终插入文本起点的选区起始
 * @param selectEnd - 相对于最终插入文本起点的选区结束
 */
export function insertSnippet(
  view: EditorView,
  snippet: string,
  selectFrom?: number,
  selectEnd?: number,
): void {
  const { from, to, empty } = view.state.selection.main;
  const line = view.state.doc.lineAt(from);
  let prefix = "";
  let insertAt = from;

  if (empty) {
    if (line.text.trim() !== "") prefix = "\n";
    else insertAt = line.from;
  } else if (from > line.from) {
    prefix = "\n";
  }

  const text = `${prefix}${snippet}`;
  insertText(
    view,
    text,
    selectFrom !== undefined ? prefix.length + selectFrom : undefined,
    selectEnd !== undefined ? prefix.length + selectEnd : undefined,
  );
}

/**
 * 用前后标记包裹选区；空选区时插入占位文本并选中。
 * @param view - 要修改的 CodeMirror 编辑器实例
 * @param before - 置于选区或占位文本前的标记
 * @param after - 置于选区或占位文本后的标记
 * @param placeholder - 空选区时插入并选中的默认文本
 */
export function wrapSelection(
  view: EditorView,
  before: string,
  after: string,
  placeholder = "",
): void {
  const { from, to, empty } = view.state.selection.main;
  if (empty) {
    const inner = placeholder;
    const wrapped = `${before}${inner}${after}`;
    view.dispatch({
      changes: { from, to, insert: wrapped },
      selection: EditorSelection.range(
        from + before.length,
        from + before.length + inner.length,
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

/**
 * 替换整行文本，不改变其他行。
 * @param view - 要修改的 CodeMirror 编辑器实例
 * @param line - 待替换行的原始范围
 * @param newText - 写入该行的新文本
 */
export function replaceLineText(
  view: EditorView,
  line: LineInfo,
  newText: string,
): void {
  view.dispatch({
    changes: { from: line.from, to: line.to, insert: newText },
    scrollIntoView: true,
  });
}

/**
 * 设置当前行行首前缀（会先剥离已有 `#` 标题前缀）。
 * 用于标题、引用、列表等行首语法。
 * @param view - 要修改的 CodeMirror 编辑器实例
 * @param prefix - 写入当前行的行首 Markdown 前缀
 * @returns 始终返回 true，表示已派发编辑事务
 */
export function setLinePrefix(view: EditorView, prefix: string): boolean {
  const line = getLineAtCursor(view);
  const pos = view.state.selection.main.head;
  const match = line.text.match(HEADING_PREFIX_RE);
  const oldPrefixLen = match ? match[0].length : 0;

  // 原文中属于“正文”的长度偏移，限制最小为 0，防止光标跑到前缀内部
  const relativePos = Math.max(0, pos - line.from - oldPrefixLen);

  const stripped = line.text.slice(oldPrefixLen);
  const newText = prefix + stripped;

  const newPos = line.from + prefix.length + relativePos;

  view.dispatch({
    changes: { from: line.from, to: line.to, insert: newText },
    selection: { anchor: newPos },
    scrollIntoView: true,
  });
  return true;
}

/**
 * 行内标记 toggle：选区已有标记则移除，否则包裹。
 * 空选区时插入占位符。
 * @param view - 要修改的 CodeMirror 编辑器实例
 * @param before - 行内语法的起始标记
 * @param after - 行内语法的结束标记
 * @param placeholder - 空选区时插入的默认内容
 */
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

/**
 * 多行选区时逐行 toggle 行内标记；单行时等同 {@link toggleInlineWrap}。
 * @param view - 要修改的 CodeMirror 编辑器实例
 * @param before - 每行前插入或匹配的标记
 * @param after - 每行后插入或匹配的标记
 * @param placeholder - 空选区时传给单行包裹逻辑的默认内容
 */
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
      changes.push({
        from: sliceFrom,
        to: sliceTo,
        insert: `${before}${part}${after}`,
      });
    }
  }

  if (changes.length) {
    view.dispatch({ changes, scrollIntoView: true });
  }
}

/**
 * 在选区末尾（或光标处）追加 Penna HTML 属性块，如 `{.highlight}`。
 * @param view - 要修改的 CodeMirror 编辑器实例
 * @param rawAttr - 用户输入的类名、id 或属性表达式
 */
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

/**
 * 将用户输入规范化为 Penna HTML 属性语法。
 * 如 `.highlight` → `{.highlight}`，`#id` → `{#id}`。
 * @param raw - 未包裹的属性输入或完整属性块
 * @returns 可直接插入的属性块；空白输入返回空字符串
 */
export function normalizeHtmlAttr(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
  if (trimmed.startsWith(".")) return `{${trimmed}}`;
  if (trimmed.startsWith("#")) return `{${trimmed}}`;
  if (trimmed.includes("=")) return `{${trimmed}}`;
  return `{.${trimmed}}`;
}

/**
 * 在文档顶部插入文本；若已有 frontmatter 则替换之。
 * @param view - 要修改的 CodeMirror 编辑器实例
 * @param text - 要作为文档头写入的文本
 */
export function insertAtDocumentTop(view: EditorView, text: string): void {
  const doc = view.state.doc.toString();
  const fm = doc.match(/^---\n[\s\S]*?\n---\n*/);
  if (fm) {
    view.dispatch({
      changes: {
        from: 0,
        to: fm[0].length,
        insert: text.endsWith("\n") ? text : `${text}\n`,
      },
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

/**
 * 在文档末尾追加文本，必要时自动补前导换行。
 * @param view - 要修改的 CodeMirror 编辑器实例
 * @param text - 要追加到文档末尾的文本
 */
export function appendToDocumentEnd(view: EditorView, text: string): void {
  const end = view.state.doc.length;
  const needsNl = end > 0 && view.state.doc.sliceString(end - 1, end) !== "\n";
  const insert = needsNl ? `\n${text}` : text;
  view.dispatch({
    changes: { from: end, to: end, insert },
    scrollIntoView: true,
  });
}
