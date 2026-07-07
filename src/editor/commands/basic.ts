import type { InsertTextPayload } from "./types.js";
import { toggleInlineWrap } from "./inline.js";
import { insertText, setLinePrefix } from "./utils.js";

export function registerBasicCommands(
  register: (
    name: string,
    handler: import("./types.js").CommandHandler,
  ) => void,
): void {
  register("bold", (view) => {
    toggleInlineWrap(view, "**", "**", "文本");
    return true;
  });
  register("italic", (view) => {
    toggleInlineWrap(view, "*", "*", "文本");
    return true;
  });
  register("strikethrough", (view) => {
    toggleInlineWrap(view, "~~", "~~", "文本");
    return true;
  });
  register("code", (view) => {
    toggleInlineWrap(view, "`", "`", "code");
    return true;
  });
  register("blockquote", (view) => {
    setLinePrefix(view, "> ");
    return true;
  });
  register("unorderedList", (view) => {
    setLinePrefix(view, "- ");
    return true;
  });
  register("orderedList", (view) => {
    setLinePrefix(view, "1. ");
    return true;
  });
  register("taskList", (view) => {
    setLinePrefix(view, "- [ ] ");
    return true;
  });
  register("horizontalRule", (view) => {
    insertText(view, "\n---\n");
    return true;
  });
  register("insertText", (view, payload) => {
    const p = payload as InsertTextPayload | string | undefined;
    if (typeof p === "string") {
      insertText(view, p);
      return true;
    }
    if (!p?.text) return false;
    insertText(view, p.text, p.selectFrom, p.selectTo);
    return true;
  });
}
