import { Tag } from "@lezer/highlight";

export const cherryTags = {
  // Blocks
  alert: Tag.define(),
  mathBlock: Tag.define(),
  container: Tag.define(),
  footnotes: Tag.define(),
  frontmatter: Tag.define(),

  // Inlines
  highlight: Tag.define(),
  spoiler: Tag.define(),
  mathInline: Tag.define(),
  badge: Tag.define(),
  inlineComment: Tag.define(),
  footnoteRef: Tag.define(),
  footnote: Tag.define(),
  frontmatterVar: Tag.define(),
  containerMark: Tag.define(),
  containerType: Tag.define(),
  htmlAttrs: Tag.define(),
  media: Tag.define(),
  iframe: Tag.define(),
  fieldTag: Tag.define(),
  pageLink: Tag.define(),
  atType: Tag.define()
};
