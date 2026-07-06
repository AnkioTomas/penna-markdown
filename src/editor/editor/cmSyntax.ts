import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import { tags as t } from "@lezer/highlight";

import { cherryTags } from "./lezer/tags";

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
  { tag: t.escape, class: "cm-escape" },

  // Blocks
  { tag: cherryTags.alert, class: "cm-ext-alert" },
  { tag: cherryTags.container, class: "cm-ext-container" },
  { tag: cherryTags.mathBlock, class: "cm-ext-math-block" },
  { tag: cherryTags.footnotes, class: "cm-ext-footnotes" },
  { tag: cherryTags.frontmatter, class: "cm-ext-frontmatter" },

  // Inlines
  { tag: cherryTags.highlight, class: "cm-ext-highlight" },
  { tag: cherryTags.spoiler, class: "cm-ext-spoiler" },
  { tag: cherryTags.mathInline, class: "cm-ext-math-inline" },
  { tag: cherryTags.badge, class: "cm-ext-badge" },
  { tag: cherryTags.inlineComment, class: "cm-ext-inline-comment" },
  { tag: cherryTags.footnoteRef, class: "cm-ext-footnote-ref" },
  { tag: cherryTags.frontmatterVar, class: "cm-ext-frontmatter-var" },
  { tag: cherryTags.htmlAttrs, class: "cm-ext-html-attrs" },
  { tag: cherryTags.media, class: "cm-ext-media" },
  { tag: cherryTags.iframe, class: "cm-ext-iframe" },
  { tag: cherryTags.fieldTag, class: "cm-ext-field-tag" },
  { tag: cherryTags.containerMark, class: "cm-ext-container-mark" },
  { tag: cherryTags.containerType, class: "cm-ext-container-type" },
  { tag: cherryTags.pageLink, class: "cm-ext-page-link" },
  { tag: cherryTags.atType, class: "cm-ext-at-type" }
]);

/** GFM 基础语法高亮 */
export function createEditorSyntaxHighlighting(): Extension {
  return syntaxHighlighting(GFM_HIGHLIGHT_STYLE);
}
