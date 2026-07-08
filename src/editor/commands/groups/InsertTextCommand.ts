/**
 * 通用文本插入命令。
 * 供程序化 API 或 `insertText` toolbar 项调用。
 */
import type { EditorView } from "@codemirror/view";
import { Command, insertText } from "@/editor/commands/Command";

/** `insertText` 命令的 payload 结构。 */
export interface InsertTextPayload {
  /** 要插入的文本。 */
  text: string;
  /** 插入后选区起始（相对插入起点）。 */
  selectFrom?: number;
  /** 插入后选区结束（相对插入起点）。 */
  selectTo?: number;
}

class InsertTextCommand implements Command {
  /**
   * @param payload - 字符串或 `{ text, selectFrom?, selectTo? }` 对象
   * @returns payload 无效时返回 false
   */
  execute(view: EditorView, payload: unknown): boolean {
    const p = payload as InsertTextPayload | string | undefined;
    if (typeof p === "string") {
      insertText(view, p);
      return true;
    }
    if (!p?.text) return false;
    insertText(view, p.text, p.selectFrom, p.selectTo);
    return true;
  }
}

/**
 * `insertText` — 程序化插入任意文本。
 * payload: `string` 或 `{ text, selectFrom?, selectTo? }`
 */
export const insertTextCommand = new InsertTextCommand();
