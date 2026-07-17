import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import { tags as t } from "@lezer/highlight";

import { pennaTags } from "./lezer/tags";

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
  { tag: pennaTags.alert, class: "cm-ext-alert" },
  { tag: pennaTags.container, class: "cm-ext-container" },
  { tag: pennaTags.mathBlock, class: "cm-ext-math-block" },
  { tag: pennaTags.footnotes, class: "cm-ext-footnotes" },
  { tag: pennaTags.frontmatter, class: "cm-ext-frontmatter" },
  { tag: pennaTags.commentBlock, class: "cm-ext-comment-block" },

  // Inlines
  { tag: pennaTags.highlight, class: "cm-ext-highlight" },
  { tag: pennaTags.spoiler, class: "cm-ext-spoiler" },
  { tag: pennaTags.mathInline, class: "cm-ext-math-inline" },
  { tag: pennaTags.badge, class: "cm-ext-badge" },
  { tag: pennaTags.inlineComment, class: "cm-ext-inline-comment" },
  { tag: pennaTags.footnoteRef, class: "cm-ext-footnote-ref" },
  { tag: pennaTags.frontmatterVar, class: "cm-ext-frontmatter-var" },
  { tag: pennaTags.htmlAttrs, class: "cm-ext-html-attrs" },
  { tag: pennaTags.media, class: "cm-ext-media" },
  { tag: pennaTags.iframe, class: "cm-ext-iframe" },
  { tag: pennaTags.fieldTag, class: "cm-ext-field-tag" },
  { tag: pennaTags.containerMark, class: "cm-ext-container-mark" },
  { tag: pennaTags.containerType, class: "cm-ext-container-type" },
  { tag: pennaTags.pageLink, class: "cm-ext-page-link" },
  { tag: pennaTags.atType, class: "cm-ext-at-type" },
  { tag: pennaTags.frontmatterMark, class: "cm-ext-frontmatter-mark" },
  { tag: pennaTags.containerKey, class: "cm-ext-container-key" },
  { tag: pennaTags.containerValue, class: "cm-ext-container-value" },
  { tag: pennaTags.containerParam, class: "cm-ext-container-param" },
  { tag: pennaTags.codeInfoKey, class: "cm-ext-codeinfo-key" },
  { tag: pennaTags.codeInfoValue, class: "cm-ext-codeinfo-value" },
  { tag: pennaTags.codeInfoFlag, class: "cm-ext-codeinfo-flag" },
]);

/** GFM 基础语法高亮 */
export function createEditorSyntaxHighlighting(): Extension {
  return syntaxHighlighting(GFM_HIGHLIGHT_STYLE);
}
