import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import { Tag, tags as t } from "@lezer/highlight";

export interface EditorCustomTagHighlight {
  tag: Tag;
  class: string;
}

let customTagId = 0;

/** 定义自定义 Lezer tag（配合语言扩展 `styleTags` 使用） */
export function defineEditorTag(): Tag {
  customTagId += 1;
  return Tag.define(`cherry-custom-${customTagId}`);
}

const GFM_HIGHLIGHT_STYLE = HighlightStyle.define([
  { tag: t.heading1, class: "cm-h1" },
  { tag: t.heading2, class: "cm-h2" },
  { tag: t.heading3, class: "cm-h3" },
  { tag: t.heading4, class: "cm-h4" },
  { tag: t.heading5, class: "cm-h5" },
  { tag: t.heading6, class: "cm-h6" },
  { tag: t.heading, class: "cm-h" },
  { tag: t.emphasis, class: "cm-em" },
  { tag: t.strong, class: "cm-strong" },
  { tag: t.strikethrough, class: "cm-strike" },
  { tag: t.link, class: "cm-link" },
  { tag: t.url, class: "cm-url" },
  { tag: t.string, class: "cm-str" },
  { tag: t.monospace, class: "cm-code" },
  { tag: t.comment, class: "cm-comment" },
  { tag: t.quote, class: "cm-quote" },
  { tag: t.list, class: "cm-list" },
  { tag: t.contentSeparator, class: "cm-hr" },
  { tag: t.labelName, class: "cm-label" },
  { tag: t.atom, class: "cm-atom" },
  { tag: t.processingInstruction, class: "cm-mark" },
]);

/** GFM 语法高亮 + 可选自定义 tag class */
export function createEditorSyntaxHighlighting(
  customTagHighlights: EditorCustomTagHighlight[] = [],
): Extension {
  if (customTagHighlights.length === 0) {
    return syntaxHighlighting(GFM_HIGHLIGHT_STYLE);
  }

  const customStyle = HighlightStyle.define(
    customTagHighlights.map(({ tag, class: className }) => ({
      tag,
      class: className,
    })),
  );

  return [syntaxHighlighting(GFM_HIGHLIGHT_STYLE), syntaxHighlighting(customStyle)];
}
