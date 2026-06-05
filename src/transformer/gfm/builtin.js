/**
 * 内置语法（仅注册当前已实现的模块）
 */

import escape from "@/transformer/gfm/inline/escape.js";
import autolink, { autolinkExt } from "@/transformer/gfm/inline/autolinks.js";
import text from "@/transformer/gfm/inline/text.js";
import codeSpan from "@/transformer/gfm/inline/code.js";
import emphasis from "@/transformer/gfm/inline/emphasis.js";
import strong from "@/transformer/gfm/inline/strong.js";
import strikethrough from "@/transformer/gfm/inline/strikethrough.js";
import heading from "@/transformer/gfm/block/heading.js";
import blockquote from "@/transformer/gfm/block/blockquote.js";
import code from "@/transformer/gfm/block/code.js";
import indentedCode from "@/transformer/gfm/block/indented-code.js";
import hr from "@/transformer/gfm/block/hr.js";
import list from "@/transformer/gfm/block/list.js";
import paragraph from "@/transformer/gfm/block/paragraph.js";
import link_ref from "@/transformer/gfm/block/link-reference-definition.js"
import links from "@/transformer/gfm/inline/links.js";
import __break from "@/transformer/gfm/inline/break.js";
import images from "@/transformer/gfm/inline/images.js";
import rawhtmlInline from "@/transformer/gfm/inline/html.js";
import rawhtmlBlock from "@/transformer/gfm/block/html.js";

export const builtinInlineSyntax = [
  escape,
  images,
  links,
  autolink,
  autolinkExt,
  rawhtmlInline,
  codeSpan,
  strikethrough,
  strong,
  emphasis,
    __break,
  text,
];

export const builtinBlockSyntax = [
  rawhtmlBlock,
  heading,
  blockquote,
  link_ref,
  code,
  indentedCode,
  hr,
  list,
  paragraph,
];
