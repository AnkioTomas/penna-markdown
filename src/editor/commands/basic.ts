import type { EditorView } from "@codemirror/view";
import type { InsertTextPayload } from "./types.js";
import { getLineAtCursor, insertText, setLinePrefix, wrapSelection } from "./utils.js";

export function registerBasicCommands(
  register: (name: string, handler: import("./types.js").CommandHandler) => void,
): void {
  register("bold", (view) => {
    wrapSelection(view, "**", "**", "text");
    return true;
  });
  register("italic", (view) => {
    wrapSelection(view, "*", "*", "text");
    return true;
  });
  register("strikethrough", (view) => {
    wrapSelection(view, "~~", "~~", "text");
    return true;
  });
  register("code", (view) => {
    wrapSelection(view, "`", "`", "code");
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
  register("codeBlock", (view) => {
    wrapSelection(view, "\n```\n", "\n```\n", "code");
    return true;
  });
  register("image", async (view, _payload, ctx) => {
    if (!ctx?.theme) return false;
    const { from, to, empty } = view.state.selection.main;
    const selected = empty ? "" : view.state.sliceDoc(from, to);
    
    // Use the link dialog for image as well since they both need text and url
    // To do this cleanly, we import requestDialog and cast to any
    // However, since we can't easily await inside register without changing types,
    // we should note that CommandHandler returns boolean | Promise<boolean>
    const data = await import("@/editor/dialog/requestDialog.js").then(m => 
      m.requestDialog(ctx.theme!, "link", { text: selected, url: "" })
    );
    
    if (!data?.url) return false;
    const altText = data.text || "alt";
    const title = data.title ? ` "${data.title}"` : "";
    insertText(view, `![${altText}](${data.url}${title})`);
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
